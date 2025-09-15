import { useState, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PanelRightIcon} from "lucide-react"
import { InfiniteCanvas } from "./infinite-canvas"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ImperativePanelHandle } from "react-resizable-panels"
import { FileList } from "./file-list"
import { RagLocal } from "./rag-local"
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';


export function AppWorkspace() {
  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport ({
      api: 'http://127.0.0.1:60316/api/chat',
      // headers: {
      //   'Content-Type': 'application/json',
      //   'Cache-Control': 'no-cache',
      //   'Connection': 'keep-alive',
      // },
    }
  ),
  });
  
  const [inputValue, setInputValue] = useState("")
  const [isInfiniteCanvasCollapsed, setIsInfiniteCanvasCollapsed] = useState(false)
  const infiniteCanvasPanelRef = useRef<ImperativePanelHandle>(null)

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

  return (
    <main className="flex flex-row h-full overflow-hidden w-full">
      <ResizablePanelGroup
        direction="horizontal"
        className="w-full"
      >
        <ResizablePanel defaultSize={30} minSize={20}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} minSize={20}>
              <div
                className={`flex flex-auto h-full bg-background`}
              >
                <FileList />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-primary" />
            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="flex flex-col h-full p-1">
                <RagLocal />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-primary" />
        <ResizablePanel defaultSize={30} minSize={20}>
          {/* ChatUI区 */}
          <div
            className={`flex flex-col flex-auto h-full overflow-hidden`}
          >
            <div className="border-b p-2 flex flex-row h-[50px] relative">
              <div className="text-md text-muted-foreground">Project Planning Assistant</div>
              <div className="absolute bottom-0 right-1 z-10">
                <PanelRightIcon 
                  className={`size-7 cursor-pointer hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md p-1.5 transition-all ${isInfiniteCanvasCollapsed ? "rotate-180" : ""}`} 
                  onClick={handleCanvasToggle} />
              </div>
            </div>
            <ScrollArea className="flex-1 p-4 rounded-md h-[calc(100vh-180px)]">
              <div className={`space-y-4 mx-auto`}>
                {messages.map(message => (
                  <div key={message.id}>
                    {message.role === 'user' ? 'User: ' : 'AI: '}
                    {message.parts.map((part, index) =>
                      part.type === 'text' ? <span key={index}>{part.text}</span> : null,
                    )}
                  </div>
                ))}
                {status === 'streaming' && (
                  <div className="flex gap-4 w-full justify-start mr-auto">
                    <div className="flex flex-col gap-2">
                      <div className="rounded-xl px-3 py-2 bg-secondary text-secondary-foreground">
                        正在生成中...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-2 h-[130px]">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  sendMessage({ text: inputValue });
                  setInputValue("")
                }}
              >
                <input
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  disabled={status !== 'ready'}
                  placeholder="Say something..."
                />
                <button type="submit" disabled={status !== 'ready' || !inputValue.trim()}>
                  {status === 'streaming' ? '生成中...' : '发送'}
                </button>
              </form>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-primary" />
        <ResizablePanel 
          ref={infiniteCanvasPanelRef}
          defaultSize={40} 
          minSize={10} 
          collapsible 
          onCollapse={() => setIsInfiniteCanvasCollapsed(true)}
          onExpand={() => setIsInfiniteCanvasCollapsed(false)}
          >
          {/* 无限画布区 */}
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
