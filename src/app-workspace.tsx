import { useState, useEffect, useRef } from "react"
import { useSidebar } from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge";
import { ChatMessageAvatar } from "@/components/ui/chat-message"
import { PanelRightIcon} from "lucide-react"
import {
  ChatInput,
  ChatInputTextArea,
  ChatInputSubmit,
} from "@/components/ui/chat-input"
import { InfiniteCanvas } from "./infinite-canvas"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ImperativePanelHandle } from "react-resizable-panels"
import { FileList } from "./file-list"
import { RagLocal } from "./rag-local"

interface Message {
  id: string
  content: string
  type: "incoming" | "outgoing"
  timestamp: Date
}

export function AppWorkspace() {
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

  const [dynamicTags, setDynamicTags] = useState<string[]>([
    "数据分析",
    "项目管理",
    "AI助手",
    "文档处理",
  ])

  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const { state, setOpen } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [isInfiniteCanvasCollapsed, setIsInfiniteCanvasCollapsed] = useState(false)
  const infiniteCanvasPanelRef = useRef<ImperativePanelHandle>(null)

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 响应式显示逻辑 
  // 各种组合的最小宽度需求
  const SIDEBAR_COLLAPSED = 60
  const SIDEBAR_EXPANDED = 280
  const FILELIST_MIN = 260
  const CHATUI_MIN = 400
  const CANVAS_MIN = 380

  // 侧边栏自动收起逻辑（单向：只收起，不自动弹开）
  const shouldAutoCollapseSidebar = windowWidth < (SIDEBAR_EXPANDED + FILELIST_MIN + CHATUI_MIN + CANVAS_MIN)
  
  // 自动收起侧边栏的逻辑（单向：只收起，不自动弹开）
  useEffect(() => {
    if (shouldAutoCollapseSidebar && !isCollapsed) {
      setOpen(false)
    }
  }, [shouldAutoCollapseSidebar, isCollapsed, setOpen])
  
  // 当前实际的侧边栏宽度
  const currentSidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  // 计算主工作区可用宽度（总宽度减去侧边栏宽度）
  const workspaceWidth = windowWidth - currentSidebarWidth

  // 处理无限画布面板的收起/展开
  const handleCanvasToggle = () => {
    if (infiniteCanvasPanelRef.current) {
      if (isInfiniteCanvasCollapsed) {
        infiniteCanvasPanelRef.current.expand()
      } else {
        infiniteCanvasPanelRef.current.collapse()
      }
    }
  }

  // 判断是否显示画布
  const shouldShowCanvas = true // workspaceWidth >= currentSidebarWidth +FILELIST_MIN + CHATUI_MIN + CANVAS_MIN

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

  return (
    <main className="flex flex-row h-full overflow-hidden w-full">
      <ResizablePanelGroup
        direction="horizontal"
        className="w-full"
      >
        <ResizablePanel defaultSize={30} minSize={20}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} minSize={20}>
              {/* <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">One</span>
              </div> */}
              {/* 文件列表区 - 始终显示 */}
              <div
                className={`flex flex-auto h-full border-r bg-background`}
              >
                <FileList />
                     
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="flex flex-col h-full p-1">
                {/* <span className="font-semibold">Two</span> */}
                <RagLocal />
                <div className="m-1 p-2 bg-muted/10 rounded-lg text-xs space-y-2">
                  <div className="font-semibold text-foreground mb-2">📊 响应式布局状态</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>窗口宽度: <span className="font-mono text-primary">{windowWidth}px</span></div>
                    <div>侧边栏: <span className="font-mono text-primary">{currentSidebarWidth}px</span></div>
                    <div>工作区: <span className="font-mono text-primary">{workspaceWidth}px</span></div>
                    <div>自动收起: <span className="font-mono text-primary">{shouldAutoCollapseSidebar ? "是" : "否"}</span></div>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <div className={`p-1 rounded bg-green-500/20 text-green-700`}>
                        文件列表<br/>
                        <span className="font-mono">px</span>
                      </div>
                      <div className={`p-1 rounded bg-green-500/20 text-green-700`}>
                        ChatUI<br/>
                        <span className="font-mono">px</span>
                      </div>
                      <div className={`p-1 rounded ${shouldShowCanvas ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
                        画布<br/>
                        <span className="font-mono">px</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={20}>
          {/* <div className="flex h-[400px] items-center justify-center p-6">
            <span className="font-semibold">Three</span>
          </div> */}
          {/* ChatUI区 - 始终显示 */}
          <div
            className={`flex flex-col flex-auto h-full overflow-hidden border-r`}
          >
            {/* Header */}
            <div className="border-b p-2 flex flex-row h-[50px] relative">
              <div className="text-md text-muted-foreground">Project Planning Assistant</div>
              <div className="absolute bottom-1 right-2 z-10">
                <PanelRightIcon 
                  className={`h-5 w-5 cursor-pointer hover:bg-muted/50 rounded p-0.5 ${isInfiniteCanvasCollapsed ? "rotate-180" : ""}`} 
                  onClick={handleCanvasToggle} />
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 rounded-md h-[calc(100vh-180px)]">
              <div className={`space-y-4 mx-auto`}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 w-full justify-start ${message.type === "outgoing" ? "ml-auto flex-row-reverse" : "mr-auto "}`}
                  >
                    <ChatMessageAvatar />
                    <div className="flex flex-col gap-2">
                      <div
                        className={`rounded-xl max-w-3/4 px-3 py-2 ${message.type === "incoming" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground ml-auto"}`}
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
            <div className="p-2 h-[130px]">
              <div className="flex flex-wrap gap-1 mb-1">
                <span className="text-muted-foreground text-xs px-2 py-1">
                  即时标签感知
                </span>
                {dynamicTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs px-2 rounded-xl">
                    {tag}
                  </Badge>
                ))}
              </div>
              <ChatInput
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onSubmit={handleSendMessage}
                loading={isLoading}
              >
                <ChatInputTextArea placeholder="Pin个文件聊天吧..." />
                <ChatInputSubmit />
              </ChatInput>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel 
          ref={infiniteCanvasPanelRef}
          defaultSize={40} 
          minSize={10} 
          collapsible 
          onCollapse={() => setIsInfiniteCanvasCollapsed(true)}
          onExpand={() => setIsInfiniteCanvasCollapsed(false)}
          >
          {/* <div>
            <span className="font-semibold">Four</span>
          </div> */}
          {/* 无限画布区 - 响应式显示 */}
          <div className={`flex flex-auto w-full bg-background h-full`}>
            <div className="flex-1">
              <InfiniteCanvas />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  )
}
