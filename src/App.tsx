import "./App.css";
import "./tweakcn/app/globals.css";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import { ChatInterface } from "./components/ChatInterface";

function App() {
  return (
    <SidebarProvider>
      <div className="flex h-full">
        <AppSidebar />
        <SidebarInset>
          <ChatInterface />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default App;