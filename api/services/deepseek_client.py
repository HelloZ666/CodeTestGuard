"""
deepseek_client.py - DeepSeek API调用封装

使用OpenAI兼容SDK调用DeepSeek API，包含重试、超时控制和成本计算。
"""

import json
import os
from typing import Optional

from loguru import logger

try:
    from openai import AsyncOpenAI, APIError, APITimeoutError, RateLimitError
except ImportError:
    AsyncOpenAI = None
    APIError = Exception
    APITimeoutError = Exception
    RateLimitError = Exception


# 配置常量
MAX_RETRIES = 1
TIMEOUT_SECONDS = 60  # DeepSeek API 超时时间
DEFAULT_MAX_TOKENS = 2000
DEFAULT_TEMPERATURE = 0.3
MODEL_NAME = "deepseek-chat"
BASE_URL = "https://api.deepseek.com"

# DeepSeek定价（每百万Token，单位：元）
PRICING = {
    "cache_hit_input": 0.2,    # 缓存命中输入
    "cache_miss_input": 2.0,   # 缓存未命中输入
    "output": 3.0,             # 输出
}


def get_client() -> Optional["AsyncOpenAI"]:
    """获取DeepSeek API客户端"""
    if AsyncOpenAI is None:
        logger.error("openai库未安装")
        return None

    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        logger.error("DEEPSEEK_API_KEY环境变量未设置")
        return None

    return AsyncOpenAI(api_key=api_key, base_url=BASE_URL)


def build_analysis_messages(
    diff_summary: str,
    mapping_info: str,
    test_cases_text: str,
) -> list[dict]:
    """
    构建分析请求的messages。

    Args:
        diff_summary: 代码差异摘要
        mapping_info: 功能映射信息
        test_cases_text: 测试用例文本

    Returns:
        OpenAI messages格式列表
    """
    system_prompt = (
        "你是一位资深测试架构师，擅长分析代码改动并评估测试用例覆盖情况。\n"
        "请根据提供的代码改动diff、功能映射和现有测试用例，分析测试覆盖缺口并给出补充建议。\n"
        "请以JSON格式输出分析结果。"
    )

    user_prompt = (
        f"## 代码改动Diff\n{diff_summary}\n\n"
        f"## 功能映射关系\n{mapping_info}\n\n"
        f"## 现有测试用例\n{test_cases_text}\n\n"
        "请分析以上信息，输出JSON格式结果，包含以下字段：\n"
        "- uncovered_methods: 未覆盖的方法列表\n"
        "- coverage_gaps: 覆盖缺口描述\n"
        "- suggested_test_cases: 建议补充的测试用例（每个包含 test_id, test_function, test_steps, expected_result）\n"
        "- risk_assessment: 风险评估（high/medium/low）\n"
        "- improvement_suggestions: 改进建议列表"
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


async def call_deepseek(
    messages: list[dict],
    max_tokens: int = DEFAULT_MAX_TOKENS,
    temperature: float = DEFAULT_TEMPERATURE,
) -> dict:
    """
    带重试和超时控制的DeepSeek API调用。

    Args:
        messages: OpenAI messages格式列表
        max_tokens: 最大输出token数
        temperature: 采样温度

    Returns:
        dict，成功时包含 result 和 usage，失败时包含 error
    """
    client = get_client()
    if client is None:
        return {"error": "DeepSeek客户端初始化失败，请检查API Key配置"}

    for attempt in range(MAX_RETRIES + 1):
        try:
            response = await client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages,
                response_format={"type": "json_object"},
                max_tokens=max_tokens,
                temperature=temperature,
                timeout=TIMEOUT_SECONDS,
            )

            content = response.choices[0].message.content
            if not content:
                # JSON Output模式偶尔返回空content
                if attempt < MAX_RETRIES:
                    logger.warning(f"DeepSeek返回空content，重试 {attempt + 1}/{MAX_RETRIES}")
                    continue
                return {"error": "AI返回空结果，请稍后重试"}

            # 解析JSON
            try:
                result = json.loads(content)
            except json.JSONDecodeError:
                if attempt < MAX_RETRIES:
                    logger.warning(f"DeepSeek返回非法JSON，重试 {attempt + 1}/{MAX_RETRIES}")
                    continue
                return {"error": "AI返回格式异常，请稍后重试"}

            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
                "prompt_cache_hit_tokens": getattr(response.usage, "prompt_cache_hit_tokens", 0),
                "prompt_cache_miss_tokens": getattr(response.usage, "prompt_cache_miss_tokens", 0),
            }

            logger.info(
                f"DeepSeek调用成功: tokens={usage['total_tokens']}, "
                f"cache_hit={usage['prompt_cache_hit_tokens']}"
            )

            return {"result": result, "usage": usage}

        except APITimeoutError:
            if attempt < MAX_RETRIES:
                logger.warning(f"DeepSeek调用超时，重试 {attempt + 1}/{MAX_RETRIES}")
                continue
            return {"error": "AI分析超时，请减少分析范围后重试"}

        except RateLimitError:
            logger.warning("DeepSeek限流")
            return {"error": "请求频率超限，请稍后重试"}

        except APIError as e:
            logger.error(f"DeepSeek API错误: {e}")
            return {"error": f"AI服务异常: {getattr(e, 'message', str(e))}"}

        except Exception as e:
            logger.error(f"DeepSeek调用异常: {e}")
            return {"error": f"调用异常: {str(e)}"}

    return {"error": "AI调用失败，请稍后重试"}


def calculate_cost(usage: dict) -> dict:
    """
    根据DeepSeek定价计算本次调用成本。

    Args:
        usage: Token用量字典

    Returns:
        成本明细（单位：元）
    """
    cache_hit_cost = usage.get("prompt_cache_hit_tokens", 0) / 1_000_000 * PRICING["cache_hit_input"]
    cache_miss_cost = usage.get("prompt_cache_miss_tokens", 0) / 1_000_000 * PRICING["cache_miss_input"]
    output_cost = usage.get("completion_tokens", 0) / 1_000_000 * PRICING["output"]
    total_cost = cache_hit_cost + cache_miss_cost + output_cost

    return {
        "input_cost": round(cache_hit_cost + cache_miss_cost, 6),
        "output_cost": round(output_cost, 6),
        "total_cost": round(total_cost, 6),
        "total_tokens": usage.get("total_tokens", 0),
    }
