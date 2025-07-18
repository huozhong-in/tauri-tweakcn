import { useState, useEffect } from "react";
import { ChatInput, ChatInputTextArea, ChatInputSubmit } from "@/components/ui/chat-input";
import { ChatMessageAvatar } from "@/components/ui/chat-message";
import { CustomScrollbar } from "./CustomScrollbar";
import { InfiniteCanvas} from "./InfiniteCanvas";

interface Message {
  id: string;
  content: string;
  type: "incoming" | "outgoing";
  timestamp: Date;
}

export function AppWorkspace() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "欢迎使用AI数据助手！您可以在这里创建新的数据任务，我会帮您从文件中提取知识片段。",
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
      content: "您可以点击左侧的\"新数据任务\"按钮开始，或者直接在这里告诉我您想要处理什么样的数据。我可以帮您分析文档、提取关键信息、生成摘要等。",
      type: "incoming",
      timestamp: new Date(Date.now() - 1000 * 60 * 2),
    },
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 响应式显示逻辑
  const shouldShowFileList = windowWidth >= 1200; // 文件列表区在1200px以下隐藏
  const shouldShowCanvas = showCanvas && windowWidth >= 1400; // 画布区在1400px以下强制隐藏

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      type: "outgoing",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "这是一个模拟的AI回复。在实际应用中，这里会连接到真正的AI服务。",
        type: "incoming",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex h-full">
      {/* 文件列表区 - 响应式隐藏 */}
      {shouldShowFileList && (
        <div className="w-80 border-r bg-background">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">标签聚合</h2>
            <p className="text-sm text-muted-foreground">文件标签聚合结果</p>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium">文档类型</div>
                <div className="text-xs text-muted-foreground">PDF (15) | DOCX (8) | TXT (23)</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium">主题标签</div>
                <div className="text-xs text-muted-foreground">技术文档 (12) | 报告 (8) | 笔记 (26)</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium">时间范围</div>
                <div className="text-xs text-muted-foreground">本周 (5) | 本月 (18) | 更早 (23)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ChatUI区 - 始终显示，响应式调整宽度 */}
      <div 
        className="flex flex-col" 
        style={{ 
          width: shouldShowCanvas 
            ? "clamp(520px, 40%, 650px)" 
            : shouldShowFileList 
              ? "clamp(520px, 50%, 780px)" 
              : "clamp(520px, 100%, 1000px)"
        }}
      >
        {/* Header */}
        <div className="border-b p-4 flex items-center gap-4">
          <div className="text-xl font-semibold">主题预览聊天</div>
          <div className="text-sm text-muted-foreground ml-auto">在这里测试您的主题效果</div>
          {windowWidth >= 1400 && (
            <button
              onClick={() => setShowCanvas(!showCanvas)}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              {showCanvas ? "隐藏画布" : "显示画布"}
            </button>
          )}
          {!shouldShowFileList && (
            <button
              onClick={() => {/* 可以添加显示文件列表的逻辑 */}}
              className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
              title="文件列表"
            >
              📁
            </button>
          )}
        </div>

        {/* Messages */}
        <CustomScrollbar className="flex-1 p-4 rounded-md">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-4 w-full ${message.type === 'outgoing' ? 'justify-end ml-auto' : 'justify-start mr-auto'}`}>
                <ChatMessageAvatar />
                <div className="flex flex-col gap-2">
                  <div className={`rounded-xl px-3 py-2 ${message.type === 'incoming' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}`}>
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
        </CustomScrollbar>

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

      {/* 无限画布区 - 响应式隐藏 */}
      {shouldShowCanvas && (
        <div className="flex-1 border-l bg-background">
          <InfiniteCanvas />
        </div>
      )}
    </div>
  );
}
