import { 
  Settings, 
  Key, 
  Cpu, 
  Globe, 
  Info, 
  Palette
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSettingsDialog } from "./ThemeSettingsDialog";
import { useSidebar } from "@/components/ui/sidebar";

export function UserProfileMenu() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className={`flex items-center gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-avatar.png" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col flex-1 text-left">
              <span className="text-sm font-medium">用户名</span>
              <span className="text-xs text-muted-foreground">user@example.com</span>
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">用户名</p>
            <p className="text-xs leading-none text-muted-foreground">
              user@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <Key className="mr-2 h-4 w-4" />
            <span>Authorization</span>
          </DropdownMenuItem>
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Cpu className="mr-2 h-4 w-4" />
              <span>Models</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem disabled>
                <span>Local Models</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <span>Business APIs</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuItem disabled>
            <Settings className="mr-2 h-4 w-4" />
            <span>General</span>
          </DropdownMenuItem>
          
          <ThemeSettingsDialog>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Palette className="mr-2 h-4 w-4" />
              <span>主题设置</span>
            </DropdownMenuItem>
          </ThemeSettingsDialog>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Info className="mr-2 h-4 w-4" />
            <span>About</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Globe className="mr-2 h-4 w-4" />
            <span>在线文档</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Globe className="mr-2 h-4 w-4" />
            <span>社区</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Globe className="mr-2 h-4 w-4" />
            <span>官网</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
