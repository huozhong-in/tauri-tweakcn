#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
# CoreGraphics/Quartz 相关的导入
from Quartz import (
    CGWindowListCopyWindowInfo,
    kCGWindowListOptionAll,
    kCGNullWindowID,
)

# 辅助功能 (Accessibility) 相关的导入都应该来自 HIServices 模块
# 某些常量可能在 Quartz 中也有定义，但函数通常在 HIServices
from HIServices import (
    AXUIElementCreateApplication,
    AXUIElementCopyAttributeValue,
    AXUIElementSetAttributeValue,
    AXUIElementPerformAction,
    AXIsProcessTrusted,
    kAXWindowsAttribute,
    kAXTitleAttribute,
    kAXMinimizedAttribute,
    kAXRaiseAction
)

from AppKit import NSRunningApplication, NSApplicationActivateIgnoringOtherApps
from CoreFoundation import kCFBooleanFalse

def activate_preview_manus_window():
    """
    查找所有"预览.app"的窗口（包括最小化的），
    找到标题包含"Manus"的窗口，取消其最小化状态，并将其激活到前台。
    """
    # 1. 获取所有窗口信息 (使用 kCGWindowListOptionAll 来包含最小化窗口)
    options = kCGWindowListOptionAll
    window_list = CGWindowListCopyWindowInfo(options, kCGNullWindowID)

    target_window_info = None
    preview_pid = None

    # 遍历窗口列表，寻找目标窗口
    for window in window_list:
        # kCGWindowLayer == 0 过滤掉很多不可见的辅助窗口
        # 同时检查 owner_name 和 window_title 是否存在以避免 KeyError
        owner_name = window.get('kCGWindowOwnerName')
        window_title = window.get('kCGWindowName')

        if owner_name == "Preview" and window_title and "Manus" in window_title:
            target_window_info = window
            preview_pid = window.get('kCGWindowOwnerPID')
            print(f"找到目标窗口: '{window_title}' (PID: {preview_pid})")
            break

    if not preview_pid:
        print("未能找到名字包含 'Manus' 的预览窗口。")
        return

    # --- 使用辅助功能 API (Accessibility API) ---

    # 2. 获取应用程序的 "AXUIElement" 引用
    app_ref = AXUIElementCreateApplication(preview_pid)
    if not app_ref:
        print(f"错误: 无法为 PID {preview_pid} 创建 AXUIElement。")
        print("请确保脚本运行的终端已在'系统设置' -> '隐私与安全性' -> '辅助功能'中被授权。")
        return

    # 3. 从应用程序引用中获取其所有窗口的列表
    # 注意：AXUIElementCopyAttributeValue 返回 (error_code, value)
    error, window_list_ref = AXUIElementCopyAttributeValue(app_ref, kAXWindowsAttribute)
    
    if error != 0 or not window_list_ref:
        print(f"错误: 无法获取应用 PID {preview_pid} 的窗口列表。错误码: {error}")
        return

    # 4. 遍历窗口列表，找到我们的目标窗口
    target_window_ref = None
    for window_ref in window_list_ref:
        error, title_ref = AXUIElementCopyAttributeValue(window_ref, kAXTitleAttribute)
        # 确保 title_ref 不为空且是字符串类型再进行 in 操作
        if error == 0 and title_ref and isinstance(title_ref, str) and "Manus" in title_ref:
            target_window_ref = window_ref
            break

    if not target_window_ref:
        print("通过辅助功能 API 未能匹配到目标窗口。")
        return

    # 5. 检查窗口是否最小化，如果是，则取消最小化
    error, is_minimized_ref = AXUIElementCopyAttributeValue(target_window_ref, kAXMinimizedAttribute)
    if error == 0 and is_minimized_ref and is_minimized_ref is not kCFBooleanFalse: # 如果不是 False，则认为是最小化
        print("窗口当前为最小化状态，正在尝试恢复...")
        # 设置 kAXMinimizedAttribute 为 False 来取消最小化
        error = AXUIElementSetAttributeValue(target_window_ref, kAXMinimizedAttribute, kCFBooleanFalse)
        if error != 0:
            print(f"取消最小化失败。错误码: {error}")
            return
        print("窗口已恢复。")
    elif error != 0:
        print(f"检查窗口最小化状态失败。错误码: {error}")

    # 6. 将窗口带到最前面 (激活)
    error = AXUIElementPerformAction(target_window_ref, kAXRaiseAction)
    if error != 0:
        print(f"将窗口置顶失败。错误码: {error}")
        return

    # 7. 最后，确保整个应用程序是活跃的
    # 这可以在某些情况下帮助解决焦点问题，即使窗口已经置顶
    app = NSRunningApplication.runningApplicationWithProcessIdentifier_(preview_pid)
    if app:
        app.activateWithOptions_(NSApplicationActivateIgnoringOtherApps)
        print(f"已激活应用程序 'Preview'。")
    else:
        print(f"警告: 无法获取 PID 为 {preview_pid} 的正在运行的应用程序实例，可能无法完全激活应用。")

    print(f"成功激活窗口: '{target_window_info.get('kCGWindowName')}'")


if __name__ == "__main__":
    # 检查辅助功能权限是否被授权
    if not AXIsProcessTrusted():
        print("错误：脚本没有辅助功能权限。")
        print("请打开 '系统设置' -> '隐私与安全性' -> '辅助功能'，")
        print("然后将您运行此脚本的应用程序（例如'终端'或'iTerm'）添加到列表中。")
        sys.exit(1)
        
    activate_preview_manus_window()