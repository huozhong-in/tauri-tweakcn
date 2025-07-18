import { useState } from "react";
import { ChatInput, ChatInputTextArea, ChatInputSubmit } from "@/components/ui/chat-input";
import { ChatMessageAvatar } from "@/components/ui/chat-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface Message {
  id: string;
  content: string;
  type: "incoming" | "outgoing";
  timestamp: Date;
}

export function ChatInterface() {
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
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"

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
    <div className="flex flex-col h-full">
      {/* Header */}
    <div className="border-b p-4 flex items-center gap-4">
      {!isCollapsed && <SidebarTrigger />}
      <div className="text-xl font-semibold">主题预览聊天</div>
      <div className="text-sm text-muted-foreground ml-auto">在这里测试您的主题效果</div>
    </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 rounded-md">
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
  );
}
