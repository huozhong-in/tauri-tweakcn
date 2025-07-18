import React from "react";
import { MessageCircle, Plus, Hash, Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { UserProfileMenu } from "./UserProfileMenu";
// import { CustomScrollbar } from "@/components/CustomScrollbar";
// import { ScrollArea } from "@/components/ui/scroll-area";

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
      <Sidebar collapsible="icon" className="border-r h-screen" {...props}>

        <SidebarHeader className="px-4 pt-4 pb-0 flex-shrink-0">
          {/* Logo */}
          <div className="flex items-center gap-2 my-4">
            <div 
              className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground cursor-pointer"
              onClick={isCollapsed ? toggleSidebar : undefined}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-semibold group-data-[collapsible=icon]:hidden">AI 数据助手</h1>
            
          </div>

          {/* Tag Cloud - Hidden when collapsed */}
          <div className="space-y-2 group-data-[collapsible=icon]:hidden">
            <h3 className="text-sm font-medium text-muted-foreground">文件标签云</h3>
            <div className="flex flex-wrap gap-1">
              {mockTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Hash className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2 p-2 justify-between">
            {/* New Task Button */}
            <Button
              variant="default"
              className="flex-1 gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:flex-none"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">新数据任务</span>
            </Button>
            {/* Search Tasks */}
            <Button
                variant="ghost"
                className="flex-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:flex-none"
                size="sm"
                onClick={() => setSearchOpen(true)}
            >
                <Search className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">搜索</span>
            </Button>
          </div>
        </SidebarHeader>
        <SidebarContent className="overflow-y-auto">
            {/* Task List */}
            <div className="space-y-1">
                <SidebarMenu>
                {mockTasks.map((task) => (
                    <SidebarMenuItem key={task.id}>
                    <SidebarMenuButton className="flex flex-col items-start h-auto p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-2">
                        <div className="flex items-center gap-2 w-full group-data-[collapsible=icon]:justify-center">
                        <MessageCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium text-sm truncate group-data-[collapsible=icon]:hidden">{task.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 group-data-[collapsible=icon]:hidden">
                        {task.preview}
                        </p>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </div>
        </SidebarContent>
        
        <SidebarFooter className="p-0 flex-shrink-0">
          <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <UserProfileMenu />
          </div>
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
