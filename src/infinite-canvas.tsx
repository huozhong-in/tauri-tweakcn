import { 
  useState, 
  // useEffect,
} from "react"
// import { useSidebar } from "@/components/ui/sidebar"
// import { ScrollArea } from "./components/ui/scroll-area"
import { Button } from "./components/ui/button"
import { openPath, revealItemInDir } from "@tauri-apps/plugin-opener"
import { open, Command } from "@tauri-apps/plugin-shell"
import {
  checkAccessibilityPermission,
  requestAccessibilityPermission,
  checkScreenRecordingPermission,
  requestScreenRecordingPermission,
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
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"

// const pdfPath = "/Users/dio/workspace/temp/pdf-embed-react-examples/public/sample2.pdf";
// const pdfPath = '/Users/dio/Downloads/AI代理的上下文工程：构建Manus的经验教训.pdf';
const pdf_path = '/Users/dio/Downloads/Context Engineering for AI Agents_ Lessons from Building Manus.pdf';


interface WindowInfo {
  x: number
  y: number
  width: number
  height: number
  bounds: string
}

export function InfiniteCanvas() {
  // 使用变量来保存PDF阅读器逻辑中心点的坐标
  const [pdfReaderCenterX, setPdfReaderCenterX] = useState(0)
  const [pdfReaderCenterY, setPdfReaderCenterY] = useState(0)
  const [isReverseScroll, setIsReverseScroll] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(22)

  const getPdfReaderName = async (pdfPath:string): Promise<string> => {
    const appleScript = `
tell application "System Events" to get name of (get default application of file "${pdfPath}")
`
    const command = Command.create("run-applescript", ["-e", appleScript])
    const output = await command.execute()
    console.log("getPdfReaderName() 执行结果:", output)
    if (output.code !== 0) {
      console.error("getPdfReaderName()执行失败:", output.stderr)
      return ""
    }
    let result = output.stdout.trim()
    // 如果是.app结束，则截取掉
    if (result.endsWith(".app")) {
      result = result.slice(0, -4)
    }
    return result
  }

  const handleOpenPDF = async (pdfPath: string): Promise<boolean> => {
    try {
      console.log("尝试打开PDF文件:", pdfPath)
      await openPath(pdfPath)
      return true

    } catch (error) {
      console.error("打开PDF时发生错误:", error)
      return false
    }
  }

  const handleActivePdfReader = async (pdf_path: string): Promise<WindowInfo | undefined> => {
  // 激活PDF阅读器窗口
    const pdfFileName = pdf_path.split("/").pop() || ""
    if (pdfFileName === "") {
      return undefined
    }
    const defaultPDFReaderName = await getPdfReaderName(pdf_path)
    const appleScript = `
// JXA (JavaScript for Automation) Script
//
// 功能:
// 1. 动态检测系统默认的 PDF 阅读器。
// 2. 在该应用中查找一个名字包含 "${pdfFileName}" 的窗口。
// 3. 如果窗口是最小化的，则恢复它。
// 4. 无论窗口之前状态如何，都将其激活并置于最前台。

'use strict';

// 定义主逻辑函数
function handlePdfWindow() {
    try {
        // 连接到动态确定的应用程序
        const targetApp = Application("${defaultPDFReaderName}");
        
        // 确保目标应用正在运行
        if (!targetApp.running()) {
            return "error: ${defaultPDFReaderName} is not running.";
        }

        // 查找目标窗口
        const targetWindow = targetApp.windows().find(win => {
            return win.name().includes('${pdfFileName}');
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
        return "error:" + e.message;
    }
}

// 调用函数并返回结果
handlePdfWindow();
`   
    const command = Command.create("run-applescript", ["-l", "JavaScript", "-e", appleScript])
    const output = await command.execute()
    console.log("handleActivePdfReader() 执行结果:", output)
    if (output.code !== 0) {
      console.error("handleActivePdfReader() 执行失败:", output.stderr)
      return undefined
    }
    
    // 解析窗口信息
    const result = output.stdout.trim()    
    if (result.startsWith("success|")) {
      const parts = result.split("|")
      if (parts.length > 1 && parts[1] !== "no_matching_window_found") {
        const window_info: WindowInfo = {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          bounds: ""
        }

        // 解析各个部分
        parts.slice(1).forEach(part => {
          if (part.startsWith("x:")) window_info.x = parseInt(part.substring(2))
          if (part.startsWith("y:")) window_info.y = parseInt(part.substring(2))
          if (part.startsWith("width:")) window_info.width = parseInt(part.substring(6))
          if (part.startsWith("height:")) window_info.height = parseInt(part.substring(7))
          if (part.startsWith("bounds:")) window_info.bounds = part.substring(7)
        })
        
        console.log("pdfreader窗口信息:", window_info)
        console.log(`窗口位置: (${window_info.x}, ${window_info.y})`)
        console.log(`窗口大小: ${window_info.width} x ${window_info.height}`)
        console.log(`窗口边界: ${window_info.bounds}`)

        // 计算PDF阅读器的逻辑中心点坐标
        setPdfReaderCenterX(window_info.x + Math.floor(window_info.width / 2))
        setPdfReaderCenterY(window_info.y + Math.floor(window_info.height / 2))
        
        return window_info
      } else {
        console.log("pdfreader应用没有窗口")
        return undefined
      }
    } else {
      return undefined
    }
  }

  async function handlePdfReaderScreenshot(pdfPath: string) {
    // 截屏
    const hasPermission = await checkScreenRecordingPermission()
    if (!hasPermission) {
      // 如果没有屏幕录制权限，尝试请求权限
      const permissionGranted = await requestScreenRecordingPermission()
      if (!permissionGranted) {
        console.log(
          "未能获取屏幕录制权限，无法截图。请在系统设置中手动开启。"
        )
        return
      }
    }
    
    // 取得pdfPath中文件名的部分
    const pdfFileName = pdfPath.split("/").pop() || ""
    if (pdfFileName === "") {
      console.error("无法获取PDF文件名，无法进行截图")
      return
    }
    // 激活PDF阅读器窗口，即使它被最小化了
    const window_info = await handleActivePdfReader(pdfPath)
    if (!window_info) {
      console.error("未能激活PDF阅读器窗口")
      return
    }
    const windows = await getScreenshotableWindows()
    if (windows.length === 0) {
      console.error("未找到可截图的窗口")
      return
    }
    let window_id = -1
    windows.forEach((win) => {
      console.log(`APPNAME: ${win.appName}, TITLE: ${win.title}，窗口ID: ${win.id}`)
      if (win.title.includes(pdfFileName)) {
        window_id = win.id
      }
    })
    if (window_id === -1) {
      console.error(`未找到包含 "${pdfFileName}" 的窗口`)
      return
    }
    const path = await getWindowScreenshot(window_id)
    // console.log(path) // xx/tauri-plugin-screenshots/window-{id}.png
    revealItemInDir(path)
    // 抢回焦点
    await Window.getCurrent().setFocus()
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

  // const handleExecuteSh = async () => {
  //   try {
  //     // 执行Shell命令
  //     const cmd = Command.create("python-version", ["--version"])
  //     const output = await cmd.execute()
  //     console.log(output)
  //   } catch (error) {
  //     console.error("执行Shell命令时发生错误:", error)
  //   }
  // }

  const handleControlPdfReader = async (pdfPath: string) => {
    try {
      // 检查辅助功能权限
      const hasPermission = await ensureAccessibilityPermission()
      console.log("权限检查结果:", hasPermission)

      if (hasPermission) {
        // --- 第1步：打开PDF并抢回焦点 ---
        const window_info = await handleActivePdfReader(pdfPath)
        if (window_info === undefined) {
          const result = await handleOpenPDF(pdfPath)
          if (!result) {
            console.error("未能打开PDF文件")
            return
          }  
        }
        const appWindow = Window.getCurrent()
        const windowFactor = await getCurrentWindow().scaleFactor();
        console.log("窗口缩放因子:", windowFactor)

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
        const scaledHalfWidth = Math.floor(halfWidth / monitor.scaleFactor)
        const scaledMonitorWidth = Math.floor(monitorSize.width / monitor.scaleFactor)
        const scaledMonitorHeight = Math.floor(monitorSize.height / monitor.scaleFactor)
        console.log(
          `AppleScript将设置“预览”窗口位置为: {左上角x:${scaledHalfWidth}, 左上角y:0, 右下角x:${scaledMonitorWidth}, 右下角y:${scaledMonitorHeight}}`
        )
        // 计算PDF阅读器的逻辑中心点坐标
        setPdfReaderCenterX(scaledHalfWidth + Math.floor((scaledMonitorWidth - scaledHalfWidth) / 2))
        setPdfReaderCenterY(Math.floor(scaledMonitorHeight / 2))
        // refer https://apple.stackexchange.com/questions/376928/apple-script-how-do-i-check-if-the-bounds-of-a-window-are-equal-to-specific-va
        const defaultPDFReaderName = await getPdfReaderName(pdfPath)
        const appleScript = `
const app = Application("${defaultPDFReaderName}");

// 确保应用至少有一个窗口，避免脚本出错
if (app.windows.length > 0) {
    const frontWindow = app.windows[0]; // 获取最前方的窗口

    // JXA 的 bounds 是一个对象: {x, y, width, height}
    // 需要将传入的坐标转换为 JXA 的格式来进行比较和设置。

    // 1. 获取窗口当前的 bounds (格式: {x, y, width, height})
    const currentBounds = frontWindow.bounds();

    // 2. 根据传入的变量，计算出目标 bounds (JXA 格式)
    const targetX = ${scaledHalfWidth};
    const targetY = 0;
    const targetWidth = ${scaledMonitorWidth} - ${scaledHalfWidth};
    const targetHeight = ${scaledMonitorHeight};

    // 3. 比较当前 bounds 和目标 bounds 的每一个属性
    //    直接比较对象 (currentBounds !== targetBounds) 是行不通的。
    if (currentBounds.x !== targetX ||
        currentBounds.y !== targetY ||
        currentBounds.width !== targetWidth ||
        currentBounds.height !== targetHeight) 
    {
        // 4. 如果不相等，就设置窗口的 bounds
        frontWindow.bounds = {
            x: targetX,
            y: targetY,
            width: targetWidth,
            height: targetHeight
        };
    }
}`
        const command = Command.create("run-applescript", ["-l", "JavaScript", "-e", appleScript])
        const output = await command.execute()
        console.log("handleControlPdfReader() 执行结果:", output)
        // 抢回焦点
        await Window.getCurrent().setFocus()
        if (output.code !== 0) {
          console.error("handleControlPdfReader() 执行失败:", output.stderr)
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
    // 向PDF阅读器的逻辑中心点的坐标发送滚动事件
    const trueScrollSpeed = isReverseScroll ? -scrollSpeed : scrollSpeed
    const response = await fetch("http://127.0.0.1:60316/scroll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        x: pdfReaderCenterX,
        y: pdfReaderCenterY,
        dy: direction === "up" ? -trueScrollSpeed : trueScrollSpeed,
      }),
    });

    if (!response.ok) {
      console.error("滚动PDF时发生错误:", response.statusText);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <main className="flex-1 overflow-auto p-4 bg-blue-100">
        <p>这里是无限画布的内容区域。</p>
        <p>您可以在这里添加任何内容，比如文本、图片、图形等。</p>
      </main>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            handleControlPdfReader(pdf_path)
          }}
          variant={"default"}
          className="flex-1 px-3 py-1 text-sm"
        >
          <span className="text-xs">打开PDF/继续阅读(激活并重排窗口)</span>
        </Button>
        <Button
          onClick={() => {
            handleActivePdfReader(pdf_path)
          }}
          variant={"default"}
          className="flex-1 px-3 py-1 text-sm"
        >
          <span className="text-xs">激活不重排窗口</span>
        </Button>
        <Button
          onClick={() => {
            handlePdfReaderScreenshot(pdf_path)
          }}
          variant={"outline"}
          className="flex-1 px-3 py-1 text-sm"
        >
          <span className="text-xs">PDF阅读器窗口截图</span>
        </Button>
      </div>
      <Button
        onClick={() => {
          handleScrollPDF("up")
        }}
        variant={"secondary"}
        className="px-3 py-1 text-sm"
      >
        <span className="text-xs">PDF阅读器向上滑动</span>
      </Button>
      <div className="flex items-center gap-2">
        <span className="text-xs">反向滚动</span>
        <Switch
          id="reverse-scroll"
          checked={isReverseScroll}
          onCheckedChange={setIsReverseScroll}
        />
        <Separator orientation="vertical" />
        <Slider
          className="flex-1"
          min={1}
          defaultValue={[25]}
          max={50}
          step={1}
          value={[scrollSpeed]}
          onValueChange={(value) => {
            setScrollSpeed(value[0])
          }}
        />
        <span className="text-xs">滚动速度: {scrollSpeed}</span>
      </div>
      <Button
        onClick={() => {
          handleScrollPDF("down")
        }}
        variant={"secondary"}
        className="px-3 py-1 text-sm"
      >
        <span className="text-xs">PDF阅读器向下滑动</span>
      </Button>
    </div>
  )
}
