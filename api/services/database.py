"""
database.py - SQLite数据库抽象层

提供项目管理和分析记录的持久化存储。
使用SQLite标准库，无需额外依赖。
"""

import json
import os
import sqlite3
from pathlib import Path
from typing import Optional


def get_db_path() -> str:
    """获取数据库文件路径，支持通过环境变量配置"""
    default_path = str(Path(__file__).resolve().parent.parent / "data" / "codetestguard.db")
    return os.environ.get("DB_PATH", default_path)


def _get_connection() -> sqlite3.Connection:
    """获取数据库连接，启用外键约束和Row工厂"""
    db_path = get_db_path()
    # 确保目录存在
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    """初始化数据库，创建表结构"""
    conn = _get_connection()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT DEFAULT '',
                mapping_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS analysis_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                code_changes_summary TEXT,
                test_coverage_result TEXT,
                test_score REAL,
                ai_suggestions TEXT,
                token_usage INTEGER DEFAULT 0,
                cost REAL DEFAULT 0.0,
                duration_ms INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS global_mapping (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(200) NOT NULL,
                mapping_data TEXT NOT NULL,
                row_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
    finally:
        conn.close()


def _row_to_dict(row: sqlite3.Row) -> dict:
    """将sqlite3.Row转换为普通字典"""
    return dict(row)


def create_project(
    name: str,
    description: str = "",
    mapping_data: Optional[dict] = None,
) -> dict:
    """
    创建新项目。

    Args:
        name: 项目名称
        description: 项目描述
        mapping_data: 映射数据字典（存储为JSON字符串）

    Returns:
        创建的项目字典
    """
    mapping_json = json.dumps(mapping_data, ensure_ascii=False) if mapping_data is not None else None
    conn = _get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO projects (name, description, mapping_data) VALUES (?, ?, ?)",
            (name, description, mapping_json),
        )
        conn.commit()
        project_id = cursor.lastrowid
        return get_project(project_id)
    finally:
        conn.close()


def get_project(project_id: int) -> Optional[dict]:
    """
    获取单个项目详情。

    Args:
        project_id: 项目ID

    Returns:
        项目字典，不存在返回None
    """
    conn = _get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM projects WHERE id = ?", (project_id,)
        ).fetchone()
        if row is None:
            return None
        result = _row_to_dict(row)
        # 解析mapping_data JSON
        if result.get("mapping_data"):
            result["mapping_data"] = json.loads(result["mapping_data"])
        return result
    finally:
        conn.close()


def list_projects() -> list[dict]:
    """
    列出所有项目。

    Returns:
        项目字典列表，按创建时间倒序
    """
    conn = _get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM projects ORDER BY created_at DESC, id DESC"
        ).fetchall()
        results = []
        for row in rows:
            d = _row_to_dict(row)
            if d.get("mapping_data"):
                d["mapping_data"] = json.loads(d["mapping_data"])
            results.append(d)
        return results
    finally:
        conn.close()


def update_project(
    project_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    mapping_data: Optional[dict] = None,
) -> Optional[dict]:
    """
    更新项目信息（部分更新）。

    Args:
        project_id: 项目ID
        name: 新名称（可选）
        description: 新描述（可选）
        mapping_data: 新映射数据（可选）

    Returns:
        更新后的项目字典，不存在返回None
    """
    # 先检查项目是否存在
    existing = get_project(project_id)
    if existing is None:
        return None

    updates = []
    params = []
    if name is not None:
        updates.append("name = ?")
        params.append(name)
    if description is not None:
        updates.append("description = ?")
        params.append(description)
    if mapping_data is not None:
        updates.append("mapping_data = ?")
        params.append(json.dumps(mapping_data, ensure_ascii=False))

    if not updates:
        return existing

    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.append(project_id)

    sql = f"UPDATE projects SET {', '.join(updates)} WHERE id = ?"
    conn = _get_connection()
    try:
        conn.execute(sql, params)
        conn.commit()
    finally:
        conn.close()

    return get_project(project_id)


def delete_project(project_id: int) -> bool:
    """
    删除项目（级联删除关联的分析记录）。

    Args:
        project_id: 项目ID

    Returns:
        是否成功删除（项目不存在返回False）
    """
    conn = _get_connection()
    try:
        cursor = conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def save_analysis_record(
    project_id: int,
    code_changes_summary: dict,
    test_coverage_result: dict,
    test_score: float,
    ai_suggestions: Optional[dict],
    token_usage: int,
    cost: float,
    duration_ms: int,
) -> dict:
    """
    保存分析记录。

    Args:
        project_id: 关联项目ID
        code_changes_summary: 代码变更摘要（JSON）
        test_coverage_result: 测试覆盖结果（JSON）
        test_score: 测试评分
        ai_suggestions: AI建议（JSON，可选）
        token_usage: Token用量
        cost: 费用
        duration_ms: 耗时（毫秒）

    Returns:
        创建的分析记录字典
    """
    conn = _get_connection()
    try:
        cursor = conn.execute(
            """INSERT INTO analysis_records
               (project_id, code_changes_summary, test_coverage_result,
                test_score, ai_suggestions, token_usage, cost, duration_ms)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                project_id,
                json.dumps(code_changes_summary, ensure_ascii=False),
                json.dumps(test_coverage_result, ensure_ascii=False),
                test_score,
                json.dumps(ai_suggestions, ensure_ascii=False) if ai_suggestions is not None else None,
                token_usage,
                cost,
                duration_ms,
            ),
        )
        conn.commit()
        record_id = cursor.lastrowid
        return get_analysis_record(record_id)
    finally:
        conn.close()


def get_analysis_record(record_id: int) -> Optional[dict]:
    """
    获取单条分析记录。

    Args:
        record_id: 记录ID

    Returns:
        分析记录字典，不存在返回None
    """
    conn = _get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM analysis_records WHERE id = ?", (record_id,)
        ).fetchone()
        if row is None:
            return None
        result = _row_to_dict(row)
        _parse_record_json_fields(result)
        return result
    finally:
        conn.close()


def list_analysis_records(
    project_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    """
    列出分析记录，支持按项目过滤和分页。

    Args:
        project_id: 按项目ID过滤（可选）
        limit: 每页数量
        offset: 偏移量

    Returns:
        分析记录字典列表
    """
    conn = _get_connection()
    try:
        if project_id is not None:
            rows = conn.execute(
                "SELECT * FROM analysis_records WHERE project_id = ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?",
                (project_id, limit, offset),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM analysis_records ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?",
                (limit, offset),
            ).fetchall()
        results = []
        for row in rows:
            d = _row_to_dict(row)
            _parse_record_json_fields(d)
            results.append(d)
        return results
    finally:
        conn.close()


def get_project_stats(project_id: int) -> dict:
    """
    获取项目统计信息。

    Args:
        project_id: 项目ID

    Returns:
        包含分析次数、平均分、最近分析时间的字典
    """
    conn = _get_connection()
    try:
        row = conn.execute(
            """SELECT
                COUNT(*) as analysis_count,
                AVG(test_score) as avg_score,
                MAX(created_at) as latest_analysis_date
               FROM analysis_records
               WHERE project_id = ?""",
            (project_id,),
        ).fetchone()
        result = _row_to_dict(row)
        return {
            "analysis_count": result["analysis_count"],
            "avg_score": round(result["avg_score"], 2) if result["avg_score"] is not None else None,
            "latest_analysis_date": result["latest_analysis_date"],
        }
    finally:
        conn.close()


def _parse_record_json_fields(record: dict) -> None:
    """解析分析记录中的JSON字段"""
    for field in ("code_changes_summary", "test_coverage_result", "ai_suggestions"):
        if record.get(field):
            record[field] = json.loads(record[field])


# ============ 全局映射管理 ============

def save_global_mapping(name: str, mapping_data: list[dict], row_count: int) -> dict:
    """
    保存全局映射数据。

    Args:
        name: 映射文件名
        mapping_data: 解析后的映射条目列表
        row_count: 映射条目数量

    Returns:
        创建的映射记录字典
    """
    conn = _get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO global_mapping (name, mapping_data, row_count) VALUES (?, ?, ?)",
            (name, json.dumps(mapping_data, ensure_ascii=False), row_count),
        )
        conn.commit()
        mapping_id = cursor.lastrowid
        return get_global_mapping(mapping_id)
    finally:
        conn.close()


def get_global_mapping(mapping_id: int) -> Optional[dict]:
    """获取单条全局映射。"""
    conn = _get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM global_mapping WHERE id = ?", (mapping_id,)
        ).fetchone()
        if row is None:
            return None
        result = _row_to_dict(row)
        if result.get("mapping_data"):
            result["mapping_data"] = json.loads(result["mapping_data"])
        return result
    finally:
        conn.close()


def list_global_mappings() -> list[dict]:
    """列出所有全局映射，按创建时间倒序。"""
    conn = _get_connection()
    try:
        rows = conn.execute(
            "SELECT id, name, row_count, created_at FROM global_mapping ORDER BY created_at DESC, id DESC"
        ).fetchall()
        return [_row_to_dict(row) for row in rows]
    finally:
        conn.close()


def get_latest_global_mapping() -> Optional[dict]:
    """获取最新的全局映射数据（用于分析时自动使用）。"""
    conn = _get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM global_mapping ORDER BY created_at DESC, id DESC LIMIT 1"
        ).fetchone()
        if row is None:
            return None
        result = _row_to_dict(row)
        if result.get("mapping_data"):
            result["mapping_data"] = json.loads(result["mapping_data"])
        return result
    finally:
        conn.close()


def delete_global_mapping(mapping_id: int) -> bool:
    """删除全局映射。"""
    conn = _get_connection()
    try:
        cursor = conn.execute("DELETE FROM global_mapping WHERE id = ?", (mapping_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()
