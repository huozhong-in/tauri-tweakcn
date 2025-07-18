import "./App.css";
import "./tweakcn/app/globals.css";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppWorkspace } from "./AppWorkspace";

function App() {
  return (
    <SidebarProvider>
      <div className="flex h-full">
        <AppSidebar />
        <SidebarInset>
          <AppWorkspace />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default App;