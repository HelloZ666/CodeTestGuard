"""
coverage_analyzer.py - 测试覆盖分析模块

对比代码改动与测试用例，通过映射关系识别未覆盖的改动。
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class MappingEntry:
    """映射关系条目"""
    package_name: str
    class_name: str
    method_name: str
    description: str

    @property
    def full_qualified_name(self) -> str:
        return f"{self.package_name}.{self.class_name}.{self.method_name}"


@dataclass
class TestCase:
    """测试用例"""
    test_id: str
    test_function: str
    test_steps: str
    expected_result: str


@dataclass
class CoverageResult:
    """覆盖分析结果"""
    total_changed_methods: int = 0
    covered_methods: list[str] = field(default_factory=list)
    uncovered_methods: list[str] = field(default_factory=list)
    coverage_rate: float = 0.0
    coverage_details: list[dict] = field(default_factory=list)
    error: Optional[str] = None


def parse_mapping_data(rows: list[dict]) -> list[MappingEntry]:
    """
    解析映射关系数据。

    Args:
        rows: CSV解析后的字典列表，每个字典包含 包名/类名/方法名/功能描述

    Returns:
        MappingEntry 列表
    """
    entries = []
    for row in rows:
        # 支持中英文字段名
        package = row.get("包名", row.get("package_name", "")).strip()
        class_name = row.get("类名", row.get("class_name", "")).strip()
        method = row.get("方法名", row.get("method_name", "")).strip()
        desc = row.get("功能描述", row.get("description", "")).strip()

        if package and class_name and method:
            entries.append(MappingEntry(
                package_name=package,
                class_name=class_name,
                method_name=method,
                description=desc,
            ))

    return entries


def parse_test_cases(rows: list[dict]) -> list[TestCase]:
    """
    解析测试用例数据。

    Args:
        rows: CSV/Excel解析后的字典列表

    Returns:
        TestCase 列表
    """
    cases = []
    for row in rows:
        test_id = str(row.get("测试用例ID", row.get("test_id", ""))).strip()
        func = row.get("测试功能", row.get("test_function", "")).strip()
        steps = row.get("测试步骤", row.get("test_steps", "")).strip()
        expected = row.get("预期结果", row.get("expected_result", "")).strip()

        if test_id and func:
            cases.append(TestCase(
                test_id=test_id,
                test_function=func,
                test_steps=steps,
                expected_result=expected,
            ))

    return cases


def analyze_coverage(
    changed_methods: list[dict],
    mapping_entries: list[MappingEntry],
    test_cases: list[TestCase],
) -> CoverageResult:
    """
    分析测试覆盖情况。

    将代码改动涉及的方法与映射关系匹配，再与测试用例进行覆盖比对。

    Args:
        changed_methods: 变更的方法列表，每个元素为 dict 包含
                         package_name, class_name, method_name
        mapping_entries: 映射关系条目列表
        test_cases: 测试用例列表

    Returns:
        CoverageResult 包含覆盖分析详情
    """
    if not changed_methods:
        return CoverageResult(error="没有检测到代码改动")

    # 建立映射关系索引：method全名 -> 功能描述
    mapping_index: dict[str, str] = {}
    for entry in mapping_entries:
        key = entry.full_qualified_name
        mapping_index[key] = entry.description

    # 收集测试用例覆盖的功能关键词
    test_keywords: set[str] = set()
    for tc in test_cases:
        # 将测试功能分词作为匹配关键词
        test_keywords.add(tc.test_function.lower())

    covered = []
    uncovered = []
    details = []

    for method in changed_methods:
        pkg = method.get("package_name", "")
        cls = method.get("class_name", "")
        mtd = method.get("method_name", "")
        full_name = f"{pkg}.{cls}.{mtd}"

        # 在映射关系中查找功能描述
        description = mapping_index.get(full_name, "")

        # 判断是否被测试用例覆盖
        is_covered = False
        matched_tests = []

        if description:
            desc_lower = description.lower()
            for tc in test_cases:
                func_lower = tc.test_function.lower()
                # 功能描述与测试功能模糊匹配
                if (desc_lower in func_lower or
                    func_lower in desc_lower or
                    _fuzzy_match(desc_lower, func_lower)):
                    is_covered = True
                    matched_tests.append(tc.test_id)

        if is_covered:
            covered.append(full_name)
        else:
            uncovered.append(full_name)

        details.append({
            "method": full_name,
            "description": description or "无映射描述",
            "is_covered": is_covered,
            "matched_tests": matched_tests,
        })

    total = len(changed_methods)
    coverage_rate = len(covered) / total if total > 0 else 0.0

    return CoverageResult(
        total_changed_methods=total,
        covered_methods=covered,
        uncovered_methods=uncovered,
        coverage_rate=round(coverage_rate, 4),
        coverage_details=details,
    )


def _fuzzy_match(desc: str, test_func: str) -> bool:
    """
    简单的模糊匹配：检查描述中的关键词是否出现在测试功能中。

    Args:
        desc: 功能描述
        test_func: 测试功能名称

    Returns:
        是否匹配
    """
    # 按常见分隔符拆分
    keywords = desc.replace(",", " ").replace("，", " ").replace("/", " ").split()
    if not keywords:
        return False

    # 至少有一半关键词命中
    match_count = sum(1 for kw in keywords if kw in test_func)
    return match_count >= max(1, len(keywords) // 2)
