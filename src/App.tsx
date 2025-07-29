import "./index.css";
import "./tweakcn/app/globals.css"
import { create } from "zustand"
import { Toaster } from "@/components/ui/sonner"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { AppWorkspace } from "./app-workspace"
import { SettingsDialog } from "./settings-dialog"

// 创建一个store来管理页面内容
interface PageState {
  currentPage: string
  currentTitle: string
  currentSubtitle: string
  setPage: (page: string, title: string, subtitle: string) => void
}

export const usePageStore = create<PageState>((set) => ({
  currentPage: "new_task", // 默认为new_task页面，会在组件中根据是否首次启动进行调整
  currentTitle: "新建任务",
  currentSubtitle: "新建数据任务",
  setPage: (page, title, subtitle) =>
    set({
      currentPage: page,
      currentTitle: title,
      currentSubtitle: subtitle,
    }),
}))

// 创建一个store来管理设置对话框状态
interface SettingsState {
  isSettingsOpen: boolean
  initialPage: string
  setSettingsOpen: (open: boolean) => void
  setInitialPage: (page: string) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isSettingsOpen: false,
  initialPage: "general",
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setInitialPage: (page) => set({ initialPage: page }),
}))

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <AppWorkspace />
      <Toaster />
      <SettingsDialog />
    </SidebarProvider>
  )
}
