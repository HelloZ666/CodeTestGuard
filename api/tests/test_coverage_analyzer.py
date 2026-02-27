"""
test_coverage_analyzer.py - 覆盖分析模块测试
"""

import pytest

from services.coverage_analyzer import (
    parse_mapping_data,
    parse_test_cases,
    analyze_coverage,
    MappingEntry,
    TestCase,
)


class TestParseMappingData:
    """测试映射关系解析"""

    def test_parse_chinese_headers(self, sample_mapping_rows):
        entries = parse_mapping_data(sample_mapping_rows)
        assert len(entries) == 4
        assert entries[0].package_name == "com.example.user"
        assert entries[0].class_name == "UserService"
        assert entries[0].method_name == "createUser"
        assert entries[0].description == "创建用户"

    def test_parse_english_headers(self):
        rows = [
            {"package_name": "com.example", "class_name": "Svc", "method_name": "run", "description": "Run"}
        ]
        entries = parse_mapping_data(rows)
        assert len(entries) == 1
        assert entries[0].method_name == "run"

    def test_parse_empty_rows(self):
        entries = parse_mapping_data([])
        assert entries == []

    def test_skip_incomplete_rows(self):
        rows = [
            {"包名": "com.example", "类名": "", "方法名": "run", "功能描述": "Run"},
            {"包名": "com.example", "类名": "Svc", "方法名": "run", "功能描述": "Run"},
        ]
        entries = parse_mapping_data(rows)
        assert len(entries) == 1  # 第一行类名为空，跳过

    def test_full_qualified_name(self, sample_mapping_rows):
        entries = parse_mapping_data(sample_mapping_rows)
        assert entries[0].full_qualified_name == "com.example.user.UserService.createUser"


class TestParseTestCases:
    """测试用例解析"""

    def test_parse_chinese_headers(self, sample_test_case_rows):
        cases = parse_test_cases(sample_test_case_rows)
        assert len(cases) == 3
        assert cases[0].test_id == "TC001"
        assert cases[0].test_function == "创建用户"

    def test_parse_empty(self):
        cases = parse_test_cases([])
        assert cases == []

    def test_skip_no_id(self):
        rows = [{"测试用例ID": "", "测试功能": "test", "测试步骤": "", "预期结果": ""}]
        cases = parse_test_cases(rows)
        assert len(cases) == 0


class TestAnalyzeCoverage:
    """测试覆盖分析"""

    def test_full_coverage(self, sample_mapping_rows, sample_test_case_rows):
        mapping = parse_mapping_data(sample_mapping_rows)
        tests = parse_test_cases(sample_test_case_rows)

        changed = [
            {"package_name": "com.example.user", "class_name": "UserService", "method_name": "createUser"},
            {"package_name": "com.example.user", "class_name": "UserService", "method_name": "updateUser"},
        ]

        result = analyze_coverage(changed, mapping, tests)
        assert result.total_changed_methods == 2
        assert len(result.covered_methods) == 2
        assert len(result.uncovered_methods) == 0
        assert result.coverage_rate == 1.0

    def test_partial_coverage(self, sample_mapping_rows, sample_test_case_rows):
        mapping = parse_mapping_data(sample_mapping_rows)
        tests = parse_test_cases(sample_test_case_rows)

        changed = [
            {"package_name": "com.example.user", "class_name": "UserService", "method_name": "createUser"},
            {"package_name": "com.example.user", "class_name": "UserService", "method_name": "deleteUser"},
        ]

        result = analyze_coverage(changed, mapping, tests)
        assert result.total_changed_methods == 2
        assert len(result.uncovered_methods) >= 1
        assert result.coverage_rate < 1.0

    def test_no_changes(self, sample_mapping_rows, sample_test_case_rows):
        mapping = parse_mapping_data(sample_mapping_rows)
        tests = parse_test_cases(sample_test_case_rows)
        result = analyze_coverage([], mapping, tests)
        assert result.error == "没有检测到代码改动"

    def test_no_mapping(self, sample_test_case_rows):
        tests = parse_test_cases(sample_test_case_rows)
        changed = [
            {"package_name": "com.example.unknown", "class_name": "Svc", "method_name": "foo"},
        ]
        result = analyze_coverage(changed, [], tests)
        assert result.total_changed_methods == 1
        assert len(result.uncovered_methods) == 1

    def test_coverage_details(self, sample_mapping_rows, sample_test_case_rows):
        mapping = parse_mapping_data(sample_mapping_rows)
        tests = parse_test_cases(sample_test_case_rows)

        changed = [
            {"package_name": "com.example.user", "class_name": "UserService", "method_name": "createUser"},
        ]

        result = analyze_coverage(changed, mapping, tests)
        assert len(result.coverage_details) == 1
        assert result.coverage_details[0]["method"] == "com.example.user.UserService.createUser"
        assert result.coverage_details[0]["is_covered"] is True
