import "./App.css";
import "./tweakcn/app/globals.css";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import { ChatInterface } from "./components/ChatInterface";

function App() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset>    
            <main className="flex-1 flex flex-col">
                <div className="flex-1 overflow-hidden">
                    <ChatInterface />
                </div>
            </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default App;
