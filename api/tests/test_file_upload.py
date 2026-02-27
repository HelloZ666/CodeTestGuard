"""
test_file_upload.py - 文件上传和解析测试
"""

import json

import pytest

from services.file_parser import (
    parse_csv,
    parse_excel,
    parse_json,
    detect_file_type,
    validate_file,
)


class TestParseCSV:
    """测试CSV解析"""

    def test_parse_normal_csv(self, sample_mapping_csv):
        rows = parse_csv(sample_mapping_csv)
        assert len(rows) > 0
        assert "包名" in rows[0]

    def test_parse_bytes_utf8(self, sample_mapping_csv):
        content = sample_mapping_csv.encode("utf-8")
        rows = parse_csv(content)
        assert len(rows) > 0

    def test_parse_bytes_utf8_bom(self, sample_mapping_csv):
        content = b"\xef\xbb\xbf" + sample_mapping_csv.encode("utf-8")
        rows = parse_csv(content)
        assert len(rows) > 0

    def test_parse_empty_csv(self):
        with pytest.raises(ValueError, match="内容为空"):
            parse_csv("")

    def test_parse_header_only(self):
        with pytest.raises(ValueError, match="没有数据行"):
            parse_csv("col1,col2,col3\n")


class TestParseJSON:
    """测试JSON解析"""

    def test_parse_normal_json(self, sample_code_changes_json):
        result = parse_json(sample_code_changes_json)
        assert isinstance(result, dict)
        assert "success" in result

    def test_parse_bytes(self, sample_code_changes_json):
        content = sample_code_changes_json.encode("utf-8")
        result = parse_json(content)
        assert isinstance(result, dict)

    def test_parse_empty(self):
        with pytest.raises(ValueError, match="内容为空"):
            parse_json("")

    def test_parse_invalid(self):
        with pytest.raises(ValueError, match="JSON格式无效"):
            parse_json("{invalid json")


class TestDetectFileType:
    """测试文件类型检测"""

    def test_csv(self):
        assert detect_file_type("test.csv") == "csv"

    def test_excel_xlsx(self):
        assert detect_file_type("test.xlsx") == "excel"

    def test_excel_xls(self):
        assert detect_file_type("test.xls") == "excel"

    def test_json(self):
        assert detect_file_type("data.json") == "json"

    def test_unknown(self):
        assert detect_file_type("file.txt") == "unknown"

    def test_case_insensitive(self):
        assert detect_file_type("TEST.CSV") == "csv"
        assert detect_file_type("DATA.JSON") == "json"


class TestValidateFile:
    """测试文件校验"""

    def test_valid_csv(self):
        err = validate_file("test.csv", b"content", ["csv"])
        assert err == ""

    def test_valid_json(self):
        err = validate_file("data.json", b"content", ["json"])
        assert err == ""

    def test_unsupported_type(self):
        err = validate_file("file.txt", b"content", ["csv", "json"])
        assert "不支持" in err

    def test_wrong_type_for_endpoint(self):
        err = validate_file("test.csv", b"content", ["json"])
        assert "不支持" in err

    def test_file_too_large(self):
        large_content = b"x" * (11 * 1024 * 1024)  # 11MB
        err = validate_file("test.csv", large_content, ["csv"], max_size_mb=10.0)
        assert "过大" in err

    def test_file_within_size(self):
        content = b"x" * 1024  # 1KB
        err = validate_file("test.csv", content, ["csv"], max_size_mb=10.0)
        assert err == ""
