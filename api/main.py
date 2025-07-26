from fastapi import FastAPI, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
import pyautogui
from Quartz.CoreGraphics import CGEventCreateScrollWheelEvent, CGEventPost, CGEventSetLocation, kCGEventSourceStateHIDSystemState, kCGScrollEventUnitPixel
from Quartz import CGPoint, CGWindowListCopyWindowInfo, kCGWindowListOptionAll, kCGNullWindowID
from AppKit import NSApplication, NSScreen, NSRunningApplication, NSWindowList, NSWorkspace
import time
import subprocess

# 导入 Accessibility API
try:
    from Quartz.CoreGraphics import (
        AXUIElementCreateApplication, 
        AXUIElementCopyAttributeNames,
        AXUIElementCopyAttributeValue,
        AXUIElementSetAttributeValue,
        kAXWindowsAttribute,
        kAXPositionAttribute,
        kAXSizeAttribute,
        kAXTitleAttribute,
        kAXMainAttribute,
        kAXFocusedAttribute,
        AXValueCreate,
        kAXValueCGPointType,
        kAXValueCGSizeType
    )
    ACCESSIBILITY_AVAILABLE = True
except ImportError:
    print("Accessibility API not available")
    ACCESSIBILITY_AVAILABLE = False

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (less secure, use with caution)
    allow_credentials=True, # Allows cookies to be included in requests
    allow_methods=["*"],    # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],    # Allows all headers
)

def send_scroll_at_point(x, y, dy):
    # 获取当前鼠标位置
    ori_pos = pyautogui.position()
    print(ori_pos.x, ori_pos.y)
    # 创建滚动事件
    event = CGEventCreateScrollWheelEvent(None, kCGEventSourceStateHIDSystemState, 1, dy)
    # 设置事件发生的坐标位置
    target_location = CGPoint(x, y)
    CGEventSetLocation(event, target_location)
    # 发送事件
    CGEventPost(kCGEventSourceStateHIDSystemState, event)
    # Reset to original location
    pyautogui.moveTo(ori_pos.x, ori_pos.y)

@app.get("/")
async def root():
    print(pyautogui.size())
    
    # 设置目标坐标
    x, y = 1578, 587  # 替换为你的目标坐标
    send_scroll_at_point(x, y, -22)
    return {"message": "Hello World"}

def get_screen_size():
    """获取主屏幕尺寸"""
    screen = NSScreen.mainScreen()
    frame = screen.frame()
    return frame.size.width, frame.size.height

def get_vscode_app_windows():
    """获取 VSCode 的窗口"""
    vscode_apps = NSRunningApplication.runningApplicationsWithBundleIdentifier_(
        "com.microsoft.VSCode"
    )
    if not vscode_apps:
        print("VSCode 未运行")
        return []
    
    vscode_pid = vscode_apps[0].processIdentifier()
    # 获取所有窗口信息
    window_list = CGWindowListCopyWindowInfo(kCGWindowListOptionAll, kCGNullWindowID)
    vscode_windows = []
    
    for window in window_list:
        if window.get('kCGWindowOwnerPID') == vscode_pid:
            # 过滤掉一些非主窗口（如菜单、工具栏等）
            window_name = window.get('kCGWindowName', '')
            window_layer = window.get('kCGWindowLayer', 0)
            bounds = window.get('kCGWindowBounds')
            
            # 只获取主窗口（有名称、在正常层级、有合理尺寸）
            if (window_name and window_layer == 0 and bounds and 
                bounds.get('Width', 0) > 200 and bounds.get('Height', 0) > 200):
                vscode_windows.append(window)
    
    return vscode_windows

def get_preview_app_windows_accessibility():
    """使用 Accessibility API 获取 Preview.app 的窗口（更稳定）"""
    if not ACCESSIBILITY_AVAILABLE:
        print("Accessibility API 不可用，回退到传统方法")
        return get_preview_app_windows()
    
    print("=== 使用 Accessibility API 获取 Preview.app 窗口 ===")
    
    # 检查 Preview.app 是否运行
    preview_apps = NSRunningApplication.runningApplicationsWithBundleIdentifier_(
        "com.apple.Preview"
    )
    
    if not preview_apps:
        print("Preview.app 未运行")
        return []
    
    preview_pid = preview_apps[0].processIdentifier()
    print(f"Preview.app PID: {preview_pid}")
    
    try:
        # 创建 Accessibility 应用程序对象
        app_ref = AXUIElementCreateApplication(preview_pid)
        
        # 获取窗口列表
        windows_ref = AXUIElementCopyAttributeValue(app_ref, kAXWindowsAttribute, None)[1]
        
        if not windows_ref:
            print("无法获取窗口列表")
            return []
        
        print(f"找到 {len(windows_ref)} 个 Accessibility 窗口")
        
        accessible_windows = []
        for i, window_ref in enumerate(windows_ref):
            try:
                # 获取窗口标题
                title = AXUIElementCopyAttributeValue(window_ref, kAXTitleAttribute, None)[1] or ""
                
                # 获取窗口位置
                position_value = AXUIElementCopyAttributeValue(window_ref, kAXPositionAttribute, None)[1]
                
                # 获取窗口大小
                size_value = AXUIElementCopyAttributeValue(window_ref, kAXSizeAttribute, None)[1]
                
                # 检查是否是主窗口
                is_main = AXUIElementCopyAttributeValue(window_ref, kAXMainAttribute, None)[1] or False
                
                print(f"Accessibility 窗口 {i+1}:")
                print(f"  标题: '{title}'")
                print(f"  是主窗口: {is_main}")
                print(f"  位置: {position_value}")
                print(f"  大小: {size_value}")
                
                # 如果是主窗口或者尺寸合理，就添加到结果中
                if is_main or (size_value and size_value.width > 200 and size_value.height > 200):
                    accessible_windows.append({
                        'window_ref': window_ref,
                        'title': title,
                        'position': position_value,
                        'size': size_value,
                        'is_main': is_main
                    })
                    print(f"  ✅ 窗口已添加到结果")
                else:
                    print(f"  ❌ 窗口被过滤掉")
                print()
                    
            except Exception as e:
                print(f"获取窗口 {i+1} 信息失败: {e}")
                continue
        
        print(f"Accessibility 方法找到 {len(accessible_windows)} 个有效窗口")
        return accessible_windows
        
    except Exception as e:
        print(f"Accessibility API 调用失败: {e}")
        return []

def set_window_using_accessibility(window_info, x, y, width, height):
    """使用 Accessibility API 设置窗口位置和大小"""
    if not ACCESSIBILITY_AVAILABLE:
        print("Accessibility API 不可用")
        return False
    
    window_ref = window_info.get('window_ref')
    if not window_ref:
        print("缺少窗口引用")
        return False
    
    try:
        # 创建新的位置值
        new_position = AXValueCreate(kAXValueCGPointType, (float(x), float(y)))
        # 创建新的大小值
        new_size = AXValueCreate(kAXValueCGSizeType, (float(width), float(height)))
        
        # 设置位置
        pos_result = AXUIElementSetAttributeValue(window_ref, kAXPositionAttribute, new_position)
        # 设置大小
        size_result = AXUIElementSetAttributeValue(window_ref, kAXSizeAttribute, new_size)
        
        print(f"Accessibility API 设置结果 - 位置: {pos_result}, 大小: {size_result}")
        
        return pos_result == 0 and size_result == 0  # 0 表示成功
        
    except Exception as e:
        print(f"使用 Accessibility API 设置窗口失败: {e}")
        return False

def set_window_using_applescript_window_menu():
    """使用 AppleScript 通过 Window 菜单操作窗口"""
    script = '''
    tell application "Preview"
        activate
    end tell
    
    delay 0.5
    
    tell application "System Events"
        tell process "Preview"
            -- 访问 Window 菜单
            click menu bar item "Window" of menu bar 1
            delay 0.2
            
            -- 查找并点击 "Move & Resize" 相关项目
            -- 注意：这需要根据实际的菜单项名称调整
            try
                click menu item "Zoom" of menu "Window" of menu bar item "Window" of menu bar 1
                return "success: used zoom"
            on error
                try
                    -- 尝试其他可能的菜单项
                    click menu item "Minimize" of menu "Window" of menu bar item "Window" of menu bar 1
                    delay 0.5
                    click menu item "Minimize" of menu "Window" of menu bar item "Window" of menu bar 1
                    return "success: used minimize/restore"
                on error errMsg
                    return "error: " & errMsg
                end try
            end try
        end tell
    end tell
    '''
    
    try:
        result = subprocess.run(['osascript', '-e', script], 
                              capture_output=True, text=True, check=True)
        output = result.stdout.strip()
        print(f"Window 菜单操作结果: {output}")
        return "success" in output
    except subprocess.CalledProcessError as e:
        print(f"Window 菜单操作失败: {e}")
        return False

def set_window_using_traffic_lights():
    """使用 AppleScript 操作窗口的交通灯按钮"""
    script = '''
    tell application "Preview"
        activate
    end tell
    
    delay 0.5
    
    tell application "System Events"
        tell process "Preview"
            set frontWindow to window 1
            
            -- 尝试操作绿色按钮（缩放按钮）
            try
                set zoomButton to button 3 of frontWindow
                click zoomButton
                return "success: clicked zoom button"
            on error errMsg
                return "error: " & errMsg
            end try
        end tell
    end tell
    '''
    
    try:
        result = subprocess.run(['osascript', '-e', script], 
                              capture_output=True, text=True, check=True)
        output = result.stdout.strip()
        print(f"交通灯操作结果: {output}")
        return "success" in output
    except subprocess.CalledProcessError as e:
        print(f"交通灯操作失败: {e}")
        return False

def get_preview_app_windows():
    """获取 Preview.app 的窗口（传统方法，作为备用）"""
    print("=== 开始获取 Preview.app 窗口（传统方法） ===")
    
    # 检查 Preview.app 是否运行
    preview_apps = NSRunningApplication.runningApplicationsWithBundleIdentifier_(
        "com.apple.Preview"
    )
    print(f"找到的 Preview 应用数量: {len(preview_apps) if preview_apps else 0}")
    
    if not preview_apps:
        print("Preview.app 未运行")
        return []
    
    preview_pid = preview_apps[0].processIdentifier()
    print(f"Preview.app PID: {preview_pid}")
    
    # 获取所有窗口信息
    print("正在获取所有窗口信息...")
    window_list = CGWindowListCopyWindowInfo(kCGWindowListOptionAll, kCGNullWindowID)
    print(f"系统中总窗口数量: {len(window_list) if window_list else 0}")
    
    preview_windows = []
    preview_related_windows = []  # 所有与 Preview 相关的窗口（包括过滤掉的）
    
    for i, window in enumerate(window_list):
        window_pid = window.get('kCGWindowOwnerPID')
        
        # 如果是 Preview 的窗口，记录详细信息
        if window_pid == preview_pid:
            window_name = window.get('kCGWindowName', '')
            window_layer = window.get('kCGWindowLayer', 0)
            bounds = window.get('kCGWindowBounds', {})
            
            window_info = {
                'name': window_name,
                'layer': window_layer,
                'bounds': bounds,
                'width': bounds.get('Width', 0),
                'height': bounds.get('Height', 0),
                'window_number': window.get('kCGWindowNumber'),
                'owner_name': window.get('kCGWindowOwnerName', ''),
            }
            preview_related_windows.append(window_info)
            
            print(f"发现 Preview 窗口 {len(preview_related_windows)}:")
            print(f"  名称: '{window_name}'")
            print(f"  所有者: '{window_info['owner_name']}'")
            print(f"  层级: {window_layer}")
            print(f"  尺寸: {window_info['width']} x {window_info['height']}")
            print(f"  窗口号: {window_info['window_number']}")
            print(f"  位置: ({bounds.get('X', 0)}, {bounds.get('Y', 0)})")
            
            # 放宽过滤条件 - 只要尺寸足够大就行
            is_large_enough = (bounds.get('Width', 0) > 200 and bounds.get('Height', 0) > 200)
            is_normal_layer = window_layer == 0
            has_bounds = bool(bounds)
            
            print(f"  过滤条件检查:")
            print(f"    正常层级: {is_normal_layer}")
            print(f"    有边界: {has_bounds}")
            print(f"    尺寸足够大: {is_large_enough}")
            
            # 放宽条件：只要是正常层级、有边界、尺寸够大就行
            if is_normal_layer and has_bounds and is_large_enough:
                preview_windows.append(window)
                print(f"  ✅ 窗口通过过滤，已添加到结果")
            else:
                print(f"  ❌ 窗口被过滤掉")
            print()
    
    print(f"Preview 相关窗口总数: {len(preview_related_windows)}")
    print(f"通过过滤的窗口数: {len(preview_windows)}")
    print("=== 获取 Preview.app 窗口完成 ===\n")
    
    return preview_windows

def set_window_position_and_size(window_info, x, y, width, height):
    """使用 AppleScript 设置窗口位置和大小"""
    window_id = window_info.get('kCGWindowNumber')
    pid = window_info.get('kCGWindowOwnerPID')
    window_name = window_info.get('kCGWindowName', '')
    
    if not window_id or not pid:
        print(f"缺少窗口信息: window_id={window_id}, pid={pid}")
        return False
    
    # 使用更精确的 AppleScript 来移动和调整窗口大小
    script = f'''
    tell application "System Events"
        try
            set targetProcess to (first process whose unix id is {pid})
            set targetWindow to (first window of targetProcess whose name is "{window_name}")
            set position of targetWindow to {{{int(x)}, {int(y)}}}
            set size of targetWindow to {{{int(width)}, {int(height)}}}
            return "success"
        on error errMsg
            return "error: " & errMsg
        end try
    end tell
    '''
    
    try:
        result = subprocess.run(['osascript', '-e', script], 
                              capture_output=True, text=True, check=True)
        output = result.stdout.strip()
        print(f"AppleScript 输出: {output}")
        
        if "success" in output:
            return True
        else:
            print(f"AppleScript 错误: {output}")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"执行 AppleScript 失败: {e}")
        print(f"stderr: {e.stderr}")
        return False

def arrange_windows():
    """将 Preview.app 窗口居中显示，用于测试"""
    # 获取屏幕尺寸
    screen_width, screen_height = get_screen_size()
    print(f"屏幕尺寸: {screen_width} x {screen_height}")
    
    # 获取 Preview.app 的窗口
    preview_windows = get_preview_app_windows()
    if not preview_windows:
        print("未找到 Preview.app 的窗口")
        return False
    
    print(f"找到 {len(preview_windows)} 个 Preview 窗口")
    
    # 打印窗口详细信息
    for i, window in enumerate(preview_windows):
        print(f"窗口 {i+1}:")
        print(f"  名称: {window.get('kCGWindowName', 'Unknown')}")
        print(f"  PID: {window.get('kCGWindowOwnerPID')}")
        print(f"  窗口ID: {window.get('kCGWindowNumber')}")
        print(f"  层级: {window.get('kCGWindowLayer')}")
        bounds = window.get('kCGWindowBounds', {})
        print(f"  当前位置: ({bounds.get('X', 0)}, {bounds.get('Y', 0)})")
        print(f"  当前大小: {bounds.get('Width', 0)} x {bounds.get('Height', 0)}")
        print()
    
    # 计算窗口位置（居中显示，占屏幕的60%）
    window_width = screen_width * 0.6
    window_height = screen_height * 0.6
    x = (screen_width - window_width) / 2
    y = (screen_height - window_height) / 2 + 40  # 稍微向下偏移
    
    # 设置 Preview.app 窗口
    success_count = 0
    for i, window in enumerate(preview_windows):
        print(f"正在设置窗口 {i+1}: {window.get('kCGWindowName', 'Unknown')}")
        success = set_window_position_and_size(window, x, y, window_width, window_height)
        if success:
            print(f"成功设置 Preview 窗口 {i+1}")
            success_count += 1
        else:
            print(f"设置 Preview 窗口 {i+1} 失败")
    
    return success_count > 0

@app.get("/test-accessibility")
async def test_accessibility():
    """测试 Accessibility API 方法"""
    if not ACCESSIBILITY_AVAILABLE:
        return {"error": "Accessibility API 不可用"}
    
    windows = get_preview_app_windows_accessibility()
    return {
        "method": "Accessibility API",
        "windows_found": len(windows),
        "windows": [{"title": w.get('title', ''), "is_main": w.get('is_main', False)} for w in windows]
    }

@app.get("/test-traffic-lights")
async def test_traffic_lights():
    """测试交通灯按钮操作"""
    success = set_window_using_traffic_lights()
    return {
        "method": "Traffic Lights",
        "success": success,
        "message": "已尝试点击绿色缩放按钮" if success else "操作失败"
    }

@app.get("/test-window-menu")
async def test_window_menu():
    """测试 Window 菜单操作"""
    success = set_window_using_applescript_window_menu()
    return {
        "method": "Window Menu",
        "success": success,
        "message": "已尝试通过 Window 菜单操作" if success else "操作失败"
    }

@app.get("/arrange-windows-new")
async def arrange_windows_new():
    """使用新方法排列窗口"""
    # 先尝试 Accessibility API
    if ACCESSIBILITY_AVAILABLE:
        windows = get_preview_app_windows_accessibility()
        if windows:
            screen_width, screen_height = get_screen_size()
            window_width = screen_width * 0.6
            window_height = screen_height * 0.6
            x = (screen_width - window_width) / 2
            y = (screen_height - window_height) / 2 + 40
            
            success_count = 0
            for window in windows:
                if set_window_using_accessibility(window, x, y, window_width, window_height):
                    success_count += 1
            
            if success_count > 0:
                return {
                    "method": "Accessibility API",
                    "success": True,
                    "message": f"成功设置 {success_count} 个窗口"
                }
    
    # 如果 Accessibility API 不行，尝试交通灯按钮
    if set_window_using_traffic_lights():
        return {
            "method": "Traffic Lights",
            "success": True,
            "message": "已点击缩放按钮"
        }
    
    # 最后尝试传统方法
    windows = get_preview_app_windows()
    if windows:
        screen_width, screen_height = get_screen_size()
        window_width = screen_width * 0.6
        window_height = screen_height * 0.6
        x = (screen_width - window_width) / 2
        y = (screen_height - window_height) / 2 + 40
        
        success_count = 0
        for window in windows:
            if set_window_position_and_size(window, x, y, window_width, window_height):
                success_count += 1
        
        if success_count > 0:
            return {
                "method": "传统 AppleScript",
                "success": True,
                "message": f"成功设置 {success_count} 个窗口"
            }
    
    return {
        "success": False,
        "message": "所有方法都失败了"
    }
async def debug_preview_windows_detailed():
    """详细的调试端点，显示所有检测过程"""
    print("\n" + "="*50)
    print("开始详细调试 Preview.app 窗口检测")
    print("="*50)
    
    # 检查应用程序运行状态
    preview_apps = NSRunningApplication.runningApplicationsWithBundleIdentifier_(
        "com.apple.Preview"
    )
    
    if not preview_apps:
        return {
            "error": "Preview.app 未运行",
            "running_applications": [],
            "all_windows": 0,
            "preview_windows": []
        }
    
    # 获取所有正在运行的应用程序（用于对比）
    all_running_apps = NSRunningApplication.runningApplications()
    running_apps_info = []
    
    for app in all_running_apps:
        bundle_id = app.bundleIdentifier()
        if bundle_id and ("preview" in bundle_id.lower() or "apple" in bundle_id.lower()):
            running_apps_info.append({
                "bundle_id": bundle_id,
                "pid": app.processIdentifier(),
                "localized_name": app.localizedName()
            })
    
    # 获取窗口信息
    preview_windows = get_preview_app_windows()  # 这会打印详细日志
    
    return {
        "message": "详细调试信息",
        "preview_app_running": True,
        "preview_pid": preview_apps[0].processIdentifier(),
        "preview_localized_name": preview_apps[0].localizedName(),
        "related_running_apps": running_apps_info,
        "filtered_windows_count": len(preview_windows),
        "has_valid_windows": len(preview_windows) > 0
    }

@app.get("/debug-preview-windows")
async def debug_preview_windows():
    """调试端点，查看 Preview.app 的窗口信息"""
    preview_windows = get_preview_app_windows()
    
    if not preview_windows:
        return {"message": "未找到 Preview.app 的窗口", "windows": []}
    
    windows_info = []
    for i, window in enumerate(preview_windows):
        bounds = window.get('kCGWindowBounds', {})
        window_info = {
            "index": i + 1,
            "name": window.get('kCGWindowName', 'Unknown'),
            "pid": window.get('kCGWindowOwnerPID'),
            "window_id": window.get('kCGWindowNumber'),
            "layer": window.get('kCGWindowLayer'),
            "position": {
                "x": bounds.get('X', 0),
                "y": bounds.get('Y', 0)
            },
            "size": {
                "width": bounds.get('Width', 0),
                "height": bounds.get('Height', 0)
            }
        }
        windows_info.append(window_info)
    
    return {
        "message": f"找到 {len(preview_windows)} 个 Preview 窗口",
        "windows": windows_info
    }

@app.get("/arrange-windows")
async def arrange_windows_endpoint():
    """API 端点，用于安排窗口"""
    # 排列窗口
    success = arrange_windows()
    if success:
        return {"message": "Windows arranged successfully"}
    else:
        return {"message": "Failed to arrange windows", "error": "Could not find or arrange Preview windows"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=60315, log_level="info")
