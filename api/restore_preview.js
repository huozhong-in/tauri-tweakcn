// JXA (JavaScript for Automation) Script
//
// 功能:
// 1. 动态检测系统默认的 PDF 阅读器。
// 2. 在该应用中查找一个名字包含 "Manus" 的窗口。
// 3. 如果窗口是最小化的，则恢复它。
// 4. 无论窗口之前状态如何，都将其激活并置于最前台。

'use strict';

// 主逻辑包裹在自执行函数中，避免污染全局作用域。
(function() {
    try {
        // 连接到动态确定的应用程序
        const targetApp = Application('Preview');
        
        // 确保目标应用正在运行
        if (!targetApp.running()) {
            return `error: Preview is not running.`;
        }

        // 查找目标窗口
        const targetWindow = targetApp.windows().find(win => {
            return win.name().includes('Manus');
        });

        // 如果找到了符合条件的窗口
        if (targetWindow) {
            // 步骤1: 检查窗口是否是最小化的。如果是，就恢复它。
            if (targetWindow.miniaturized()) {
                targetWindow.miniaturized = false;
            }
            
            // 步骤2: 激活目标应用，使其成为当前活跃的应用
            targetApp.activate();
            
            // 步骤3: 将目标窗口置于最前台。
            targetWindow.index = 1;
            
            // 步骤4: 获取窗口的位置和尺寸信息
            const bounds = targetWindow.bounds();
            const x = bounds.x;
            const y = bounds.y;
            const width = bounds.width;
            const height = bounds.height;
            
            // 返回成功信息
            return "success|x:" + x + "|y:" + y + "|width:" + width + "|height:" + height + "|bounds:" + bounds.x + "," + bounds.y + "," + (bounds.x + bounds.width) + "," + (bounds.y + bounds.height);
        } else {
            // 如果没有找到符合条件的窗口
            return "success|no_matching_window_found";
        }

    } catch (e) {
        // 如果在执行过程中发生任何错误，捕获并返回错误信息
        return "error: " + e.message;
    }
})();
