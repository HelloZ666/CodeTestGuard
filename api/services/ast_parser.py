"""
ast_parser.py - Java代码AST解析模块

使用javalang进行Java代码AST解析，准确提取包名、类名和方法名。
"""

from dataclasses import dataclass, field
from typing import Optional

try:
    import javalang
except ImportError:
    javalang = None


@dataclass
class MethodInfo:
    """方法信息"""
    package_name: str
    class_name: str
    method_name: str
    modifiers: list[str] = field(default_factory=list)
    return_type: Optional[str] = None
    parameters: list[str] = field(default_factory=list)

    @property
    def full_qualified_name(self) -> str:
        """完整限定名：package.Class.method"""
        return f"{self.package_name}.{self.class_name}.{self.method_name}"


@dataclass
class ClassInfo:
    """类信息"""
    package_name: str
    class_name: str
    methods: list[MethodInfo] = field(default_factory=list)

    @property
    def full_qualified_name(self) -> str:
        """完整限定名：package.Class"""
        return f"{self.package_name}.{self.class_name}"


@dataclass
class ParseResult:
    """解析结果"""
    classes: list[ClassInfo] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


def parse_java_code(source_code: str) -> ParseResult:
    """
    解析Java源代码，提取包名、类名和方法名。

    Args:
        source_code: Java源代码字符串

    Returns:
        ParseResult 包含解析出的类和方法信息
    """
    if javalang is None:
        return ParseResult(errors=["javalang库未安装"])

    if not source_code or not source_code.strip():
        return ParseResult(errors=["源代码为空"])

    try:
        tree = javalang.parse.parse(source_code)
    except javalang.parser.JavaSyntaxError as e:
        return ParseResult(errors=[f"Java语法错误: {e}"])
    except Exception as e:
        return ParseResult(errors=[f"解析异常: {e}"])

    # 提取包名
    package_name = ""
    if tree.package:
        package_name = tree.package.name

    classes = []

    # 遍历所有类型声明（class, interface, enum）
    for type_decl in tree.types:
        if not hasattr(type_decl, "name"):
            continue

        class_name = type_decl.name
        methods = []

        # 提取方法
        if hasattr(type_decl, "body") and type_decl.body:
            for member in type_decl.body:
                if isinstance(member, javalang.tree.MethodDeclaration):
                    # 提取修饰符
                    modifiers = list(member.modifiers) if member.modifiers else []

                    # 提取返回类型
                    return_type = None
                    if member.return_type:
                        return_type = member.return_type.name if hasattr(member.return_type, "name") else str(member.return_type)

                    # 提取参数类型
                    params = []
                    if member.parameters:
                        for param in member.parameters:
                            param_type = param.type.name if hasattr(param.type, "name") else str(param.type)
                            params.append(param_type)

                    method_info = MethodInfo(
                        package_name=package_name,
                        class_name=class_name,
                        method_name=member.name,
                        modifiers=modifiers,
                        return_type=return_type,
                        parameters=params,
                    )
                    methods.append(method_info)

                elif isinstance(member, javalang.tree.ConstructorDeclaration):
                    # 构造函数也记录
                    modifiers = list(member.modifiers) if member.modifiers else []
                    params = []
                    if member.parameters:
                        for param in member.parameters:
                            param_type = param.type.name if hasattr(param.type, "name") else str(param.type)
                            params.append(param_type)

                    method_info = MethodInfo(
                        package_name=package_name,
                        class_name=class_name,
                        method_name=member.name,
                        modifiers=modifiers,
                        return_type=None,
                        parameters=params,
                    )
                    methods.append(method_info)

        class_info = ClassInfo(
            package_name=package_name,
            class_name=class_name,
            methods=methods,
        )
        classes.append(class_info)

    return ParseResult(classes=classes)


def extract_methods_from_code(source_code: str) -> list[MethodInfo]:
    """
    从Java代码中提取所有方法的简化接口。

    Args:
        source_code: Java源代码字符串

    Returns:
        方法信息列表
    """
    result = parse_java_code(source_code)
    methods = []
    for cls in result.classes:
        methods.extend(cls.methods)
    return methods


def extract_changed_methods(current_code: str, history_code: str) -> list[MethodInfo]:
    """
    对比当前和历史代码，提取变更的方法。

    通过比较两个版本的方法列表来识别新增和修改的方法。

    Args:
        current_code: 当前版本代码
        history_code: 历史版本代码

    Returns:
        变更的方法列表（新增 + 修改）
    """
    current_methods = extract_methods_from_code(current_code)
    history_methods = extract_methods_from_code(history_code)

    # 建立历史方法签名集合
    history_signatures = set()
    for m in history_methods:
        sig = f"{m.package_name}.{m.class_name}.{m.method_name}({','.join(m.parameters)})"
        history_signatures.add(sig)

    # 找出新增的方法
    changed = []
    for m in current_methods:
        sig = f"{m.package_name}.{m.class_name}.{m.method_name}({','.join(m.parameters)})"
        if sig not in history_signatures:
            changed.append(m)

    return changed
