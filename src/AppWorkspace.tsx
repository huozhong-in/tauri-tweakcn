import { useState, useEffect } from "react"
import {
  ChatInput,
  ChatInputTextArea,
  ChatInputSubmit,
} from "@/components/ui/chat-input"
import { ChatMessageAvatar } from "@/components/ui/chat-message"
import { InfiniteCanvas } from "./InfiniteCanvas"
import { useSidebar } from "@/components/ui/sidebar"
import { ScrollArea } from "./components/ui/scroll-area"
import { Button } from "./components/ui/button"
import { openPath } from "@tauri-apps/plugin-opener"
import { open, Command } from "@tauri-apps/plugin-shell"
import {
  checkAccessibilityPermission,
  requestAccessibilityPermission,
} from "tauri-plugin-macos-permissions-api"
import {
  getCurrentWindow,
  PhysicalPosition,
  Window,
  PhysicalSize,
  availableMonitors,
  currentMonitor,
} from "@tauri-apps/api/window"
import {
  getScreenshotableWindows,
  getWindowScreenshot,
} from "tauri-plugin-screenshots-api"

async function captureScreen() {
  const windows = await getScreenshotableWindows()
  const path = await getWindowScreenshot(windows[0].id)
  console.log(path) // xx/tauri-plugin-screenshots/window-{id}.png
}
async function ensureAccessibilityPermission() {
  try {
    console.log("检查辅助功能权限...")
    let hasPermission = await checkAccessibilityPermission()
    console.log("当前权限状态:", hasPermission)

    if (!hasPermission) {
      console.log("权限不足，请求权限...")
      // 如果没有权限，发起请求
      const permissionGranted = await requestAccessibilityPermission()
      console.log("权限请求结果:", permissionGranted)

      if (!permissionGranted) {
        // 用户在弹窗中选择了"拒绝"，或者没有完成授权
        console.log("用户拒绝或未完成权限授权")
        alert(
          "未能获取辅助功能权限，无法控制其他应用。请在系统设置中手动开启。"
        )
        return false
      }
      // 更新权限状态
      hasPermission = await checkAccessibilityPermission()
      console.log("权限更新后状态:", hasPermission)
    }

    return hasPermission
  } catch (error) {
    console.error("权限检查过程中发生错误:", error)
    const errorMessage = error instanceof Error ? error.message : "未知错误"
    alert(`权限检查失败: ${errorMessage}`)
    return false
  }
}

interface Message {
  id: string
  content: string
  type: "incoming" | "outgoing"
  timestamp: Date
}

export function AppWorkspace() {
  // 使用变量来保存预览app逻辑中心点的坐标
  const [previewAppCenterX, setPreviewAppCenterX] = useState(0)
  const [previewAppCenterY, setPreviewAppCenterY] = useState(0)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "欢迎使用AI数据助手！您可以在这里创建新的数据任务，我会帮您从文件中提取知识片段。",
      type: "incoming",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: "2",
      content: "如何开始一个新的数据任务？",
      type: "outgoing",
      timestamp: new Date(Date.now() - 1000 * 60 * 3),
    },
    {
      id: "3",
      content:
        '您可以点击左侧的"新数据任务"按钮开始，或者直接在这里告诉我您想要处理什么样的数据。我可以帮您分析文档、提取关键信息、生成摘要等。',
      type: "incoming",
      timestamp: new Date(Date.now() - 1000 * 60 * 2),
    },
  ])

  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 响应式显示逻辑 - 用户意图优先

  // 各种组合的最小宽度需求
  const CANVAS_MIN = 380 // 从400减少到380
  const CHATUI_MIN = 420 // 从450减少到420
  const FILELIST_MIN = 260 // 从280减少到260
  const SIDEBAR_EXPANDED = 280
  const SIDEBAR_COLLAPSED = 60

  // 当前实际的侧边栏宽度
  const currentSidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  // 计算主工作区可用宽度（总宽度减去侧边栏宽度）
  const workspaceWidth = windowWidth - currentSidebarWidth

  // 判断当前主工作区能容纳哪些组合
  const canFitExpandedSidebarWithChatUI =
    windowWidth >= SIDEBAR_EXPANDED + CHATUI_MIN + CANVAS_MIN

  // 判断是否显示各个区域（基于主工作区可用宽度）
  const shouldShowFileList =
    workspaceWidth >= FILELIST_MIN + CHATUI_MIN + CANVAS_MIN
  const shouldShowChatUI = workspaceWidth >= CHATUI_MIN + CANVAS_MIN

  // 计算各区域宽度
  const getLayoutWidths = () => {
    const fileListWidth = shouldShowFileList
      ? Math.min(
          350,
          Math.max(
            FILELIST_MIN,
            (workspaceWidth - CHATUI_MIN - CANVAS_MIN) * 0.2
          )
        )
      : 0
    const chatUIWidth = shouldShowChatUI
      ? Math.min(
          650,
          Math.max(
            CHATUI_MIN,
            (workspaceWidth - fileListWidth - CANVAS_MIN) * 0.4
          )
        )
      : 0
    const canvasWidth = Math.max(
      CANVAS_MIN,
      workspaceWidth - fileListWidth - chatUIWidth
    )

    return { fileListWidth, chatUIWidth, canvasWidth }
  }

  const { fileListWidth, chatUIWidth, canvasWidth } = getLayoutWidths()

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      type: "outgoing",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "这是一个模拟的AI回复。在实际应用中，这里会连接到真正的AI服务。",
        type: "incoming",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleOpenPDF = async () => {
    try {
      const pdfPath =
        "/Users/dio/workspace/temp/pdf-embed-react-examples/public/sample2.pdf"
      // const pdfPath = '/Users/dio/Downloads/AI代理的上下文工程：构建Manus的经验教训.pdf';
      console.log("尝试打开PDF文件:", pdfPath)
      await openPath(pdfPath)
    } catch (error) {
      console.error("打开PDF时发生错误:", error)
    }
  }

  const handleExecuteSh = async () => {
    try {
      // 执行Shell命令
      const cmd = Command.create("python-version", ["--version"])
      const output = await cmd.execute()
      console.log(output)
    } catch (error) {
      console.error("执行Shell命令时发生错误:", error)
    }
  }

  const handleControlPreviewApp = async () => {
    try {
      console.log("开始控制预览应用...")

      // 检查辅助功能权限
      const hasPermission = await ensureAccessibilityPermission()
      console.log("权限检查结果:", hasPermission)

      if (hasPermission) {
        // --- 第1步：打开PDF并抢回焦点 (使用我们之前讨论的稳定版方案) ---
        await handleOpenPDF()
        await new Promise((resolve) => setTimeout(resolve, 1000)) // 短暂等待，确保“预览”已启动
        const appWindow = Window.getCurrent()
        const windowFactor = await getCurrentWindow().scaleFactor();
        console.log("窗口缩放因子:", windowFactor)
        await appWindow.setFocus()

        // const windowList = await Window.getAll();
        // console.log("当前所有窗口列表:", windowList);

        // --- 第2步：获取显示器信息 ---
        const monitors = await availableMonitors()
        console.log("当前可用的显示器列表:", monitors)
        const monitor = await currentMonitor()
        if (!monitor) throw new Error("无法获取主显示器信息。")
        console.log("当前显示器的缩放因子:", monitor.scaleFactor)

        const monitorSize = monitor.size
        console.log("当前显示器信息:", monitor)
        const halfWidth = monitorSize.width / 2
        console.log("当前显示器宽度的一半:", halfWidth)

        // --- 第3步：将Tauri应用窗口置于左侧 ---
        console.log("正在将本应用窗口移动到左侧...")
        await appWindow.setSize(new PhysicalSize(halfWidth, monitorSize.height))
        // 使用 monitor.position 来处理多显示器情况更佳
        await appWindow.setPosition(
          new PhysicalPosition(monitor.position.x, monitor.position.y)
        )
        // --- 第4步：通过AppleScript将“预览”窗口置于右侧 ---
        console.log("正在将“预览”窗口移动到右侧...")
        // 设置窗口的边界 {x1, y1, x2, y2}
        // x1 = 左上角x, y1 = 左上角y
        // x2 = 右下角x, y2 = 右下角y
        // AppleScript使用LogicalPosition和LogicalSize来处理窗口位置和大小，需要用scaleFactor来转换
        const scaledHalfWidth = Math.round(halfWidth / monitor.scaleFactor)
        const scaledMonitorWidth = Math.round(monitorSize.width / monitor.scaleFactor)
        const scaledMonitorHeight = Math.round(monitorSize.height / monitor.scaleFactor)
        console.log(
          `AppleScript将设置“预览”窗口位置为: {左上角x:${scaledHalfWidth}, 左上角y:0, 右下角x:${scaledMonitorWidth}, 右下角y:${scaledMonitorHeight}}`
        )
        // 计算预览app的逻辑中心点坐标
        setPreviewAppCenterX(scaledHalfWidth + Math.round((scaledMonitorWidth - scaledHalfWidth) / 2))
        setPreviewAppCenterY(Math.round(scaledMonitorHeight / 2))
        const appleScript = `
          tell application "Preview"
            if (bounds of front window) is not equal to {${scaledHalfWidth}, 0, ${scaledMonitorWidth}, ${scaledMonitorHeight}} then
              set bounds of front window to {${scaledHalfWidth}, 0, ${scaledMonitorWidth}, ${scaledMonitorHeight}}
            end if
          end tell
        `
        const command = Command.create("run-applescript", ["-e", appleScript])
        const output = await command.execute()
        if (output.code !== 0) {
          console.error("AppleScript执行失败:", output.stderr)
        } else {
          console.log("分屏布局设置成功！")
        }
      } else {
        console.log("权限不足，打开系统设置...")
        await open(
          "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
        )
      }
    } catch (error) {
      console.error("控制预览应用时发生错误:", error)
    }
  }

  const handleScrollPDF = async (direction: "up" | "down") => {
    // 控制PDF阅读器翻页
    // 如果阅读器不在“最前面”，则先激活它
    const appleScript = `
      tell application "Preview"
        activate
      end tell
    `
    // const appleScript = `
    //   try
    //     tell application "System Events"
    //       -- 获取指定坐标下的窗口
    //       set windowAtPoint to window at {${previewAppCenterX}, ${previewAppCenterY}}
    //       set appName to name of application process of windowAtPoint
    //     end tell
        
    //     if appName is "Preview" then
    //       return "preview_at_coordinates"
    //     else
    //       tell application "Preview"
    //         activate
    //       end tell
    //       return "activated_preview"
    //     end if
        
    //   on error errorMessage
    //     -- 如果无法获取坐标下的窗口，直接激活Preview
    //     tell application "Preview"
    //       activate
    //     end tell
    //     return "activated_fallback"
    //   end try
    // `
    const command = Command.create("run-applescript", ["-e", appleScript])
    const output = await command.execute()
    if (output.code !== 0) {
      console.error("AppleScript执行失败:", output.stderr)
      return
    }
    console.log("AppleScript执行结果:", output.stdout.trim())
    // 抢回焦点
    const appWindow = Window.getCurrent()
    await appWindow.setFocus()
    // 向PDF阅读器的逻辑中心点的坐标发送滚动事件
    const response = await fetch("http://127.0.0.1:60315/scroll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        x: previewAppCenterX,
        y: previewAppCenterY,
        dy: direction === "up" ? -22 : 22,
      }),
    });

    if (!response.ok) {
      console.error("滚动PDF时发生错误:", response.statusText);
    }
  };

  return (
    <div className="flex h-full relative">
      {/* 文件列表区 - 响应式显示 */}
      {shouldShowFileList && (
        <div
          className="border-r bg-background flex-shrink-0"
          style={{ width: `${fileListWidth}px` }}
        >
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">标签聚合</h2>
            <p className="text-sm text-muted-foreground">文件标签聚合结果</p>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium">文档类型</div>
                <div className="text-xs text-muted-foreground">
                  PDF (15) | DOCX (8) | TXT (23)
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium">主题标签</div>
                <div className="text-xs text-muted-foreground">
                  技术文档 (12) | 报告 (8) | 笔记 (26)
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium">时间范围</div>
                <div className="text-xs text-muted-foreground">
                  本周 (5) | 本月 (18) | 更早 (23)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ChatUI区 - 响应式显示 */}
      {shouldShowChatUI && (
        <div
          className="flex flex-col border-r flex-shrink-0"
          style={{ width: `${chatUIWidth}px` }}
        >
          {/* Header */}
          <div className="border-b p-4 flex items-center gap-4">
            <div className="text-xl font-semibold">AI对话</div>
            <div className="text-sm text-muted-foreground ml-auto">
              知识挖掘助手
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 rounded-md h-full">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 w-full ${
                    message.type === "outgoing"
                      ? "justify-end ml-auto"
                      : "justify-start mr-auto"
                  }`}
                >
                  <ChatMessageAvatar />
                  <div className="flex flex-col gap-2">
                    <div
                      className={`rounded-xl px-3 py-2 ${
                        message.type === "incoming"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {message.content}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 w-full justify-start mr-auto">
                  <ChatMessageAvatar />
                  <div className="flex flex-col gap-2">
                    <div className="rounded-xl px-3 py-2 bg-secondary text-secondary-foreground">
                      正在输入...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-4">
            <ChatInput
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onSubmit={handleSendMessage}
              loading={isLoading}
            >
              <ChatInputTextArea placeholder="输入您的消息..." />
              <ChatInputSubmit />
            </ChatInput>
          </div>
        </div>
      )}

      {/* 无限画布区 - 始终显示，是核心价值区域 */}
      <div
        className="flex-1 bg-background"
        style={{ minWidth: `${Math.max(CANVAS_MIN, canvasWidth)}px` }}
      >
        <div className="flex-1 w-full h-full p-4 flex flex-col gap-4">
          <InfiniteCanvas />
          <Button
            onClick={() => {
              handleControlPreviewApp()
            }}
            className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            <span className="text-xs">打开PDF并重排窗口</span>
          </Button>
          <Button
            onClick={() => {
              handleScrollPDF("up")
            }}
            className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            <span className="text-xs">PDF阅读器向上滑动</span>
          </Button>
          
          <Button
            onClick={() => {
              handleScrollPDF("down")
            }}
            className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            <span className="text-xs">PDF阅读器向下滑动</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
