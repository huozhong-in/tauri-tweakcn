import { 
  Tag,
} from "lucide-react"
import {
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export function NavTagCloud() {
  
  
  //  shadow-sm border border-border
  return (
    <SidebarGroup className=" bg-background rounded-md pr-0">
      <SidebarGroupLabel>
        <Tag className="mr-2 h-4 w-4" />file-tags
      </SidebarGroupLabel>
      
      <ScrollArea className="h-[250px] p-0 m-0">
        <div className="flex flex-wrap gap-1 p-1 justify-start">
          <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-18 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-22 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-10 rounded-full" />
              <Skeleton className="h-6 w-26 rounded-full" />
              <Skeleton className="h-6 w-15 rounded-full" />
        </div>
      </ScrollArea>
    </SidebarGroup>
  )
}
