import React from "react";
import { MessageCircle, Plus, Hash, Sparkles, PanelLeftOpenIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { UserProfileMenu } from "./UserProfileMenu";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  
  // Mock data for tasks
  const mockTasks = [
    { id: "1", title: "数据分析任务", preview: "分析用户行为数据..." },
    { id: "2", title: "文档提取", preview: "从PDF中提取关键信息..." },
    { id: "3", title: "知识整理", preview: "整理会议记录内容..." },
    { id: "4", title: "内容摘要", preview: "生成文章摘要..." },
    { id: "5", title: "报告生成", preview: "自动生成数据报告..." },
    { id: "6", title: "文档翻译", preview: "多语言文档翻译..." },
    { id: "7", title: "数据清洗", preview: "清理和整理数据..." },
    { id: "8", title: "情感分析", preview: "分析文本情感倾向..." }
  ];

  // Mock data for tags
  const mockTags = [
    "数据分析", "文档处理", "知识管理", "AI助手", "自动化", "报告生成"
  ];

  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <>
      <Sidebar collapsible="icon" className="border-r" {...props}>
      <SidebarHeader className="p-4">
        {/* Logo */}
        <div className="flex items-center gap-2 my-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className={`w-4 h-4 object-contain ${isCollapsed ? "cursor-pointer" : ""}`}
                onClick={isCollapsed ? toggleSidebar : undefined}
            />
            {isCollapsed && 
                <div 
                className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-80 cursor-pointer bg-white bg-opacity-0 hover:bg-opacity-70 rounded-md transition-all" 
                onClick={toggleSidebar}
                >
                <PanelLeftOpenIcon className="h-4 w-4 p-2" />
                </div>
            }
          </div>
          <h1 className="text-lg font-semibold">AI 数据助手</h1>
        </div>

        {/* Tag Cloud */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">标签云</h3>
          <div className="flex flex-wrap gap-1">
            {mockTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                <Hash className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <div className="space-y-4">
          {/* New Task Button */}
          <Button
            variant="default"
            className="w-full justify-start gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            新数据任务
          </Button>

          {/* Search Tasks */}
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            size="sm"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            搜索任务...
          </Button> 
          </div>
          
          {/* Task List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">任务列表</h3>
            <div className="space-y-1">
              <SidebarMenu>
                {mockTasks.map((task) => (
                  <SidebarMenuItem key={task.id}>
                    <SidebarMenuButton className="flex flex-col items-start h-auto p-3">
                      <div className="flex items-center gap-2 w-full">
                        <MessageCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{task.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {task.preview}
                      </p>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          </div>
        </div>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <UserProfileMenu />
      </SidebarFooter>
    </Sidebar>
    
    {/* Search Dialog */}
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
      <CommandInput placeholder="搜索任务..." />
      <CommandList>
        <CommandEmpty>未找到任务。</CommandEmpty>
        <CommandGroup heading="任务列表">
          {mockTasks.map((task) => (
            <CommandItem key={task.id} onSelect={() => setSearchOpen(false)}>
              <MessageCircle className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">{task.title}</span>
                <span className="text-xs text-muted-foreground">{task.preview}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  </>
  );
}
