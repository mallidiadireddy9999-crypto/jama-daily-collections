import { User, FileText, HelpCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AppSidebarProps {
  onClose: () => void;
}

export function AppSidebar({ onClose }: AppSidebarProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "లోపం",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "విజయవంతంగా లాగ్ అవుట్ అయ్యారు",
        description: "వీడ్కోలు!",
      });
      navigate('/login');
    }
    onClose();
  };

  const handleProfile = () => {
    // Navigate to profile page (to be implemented)
    toast({
      title: "ప్రొఫైల్",
      description: "ప్రొఫైల్ పేజీ త్వరలో వస్తుంది",
    });
    onClose();
  };

  const handlePurchaseHistory = () => {
    // Navigate to purchase history (to be implemented)
    toast({
      title: "కొనుగోలు చరిత్ర",
      description: "కొనుగోలు చరిత్ర త్వరలో వస్తుంది",
    });
    onClose();
  };

  const handleHelp = () => {
    // Navigate to help page (to be implemented)
    toast({
      title: "సహాయం",
      description: "సహాయం పేజీ త్వరలో వస్తుంది",
    });
    onClose();
  };

  const menuItems = [
    {
      title: "ప్రొఫైల్",
      icon: User,
      onClick: handleProfile,
    },
    {
      title: "కొనుగోలు చరిత్ర",
      icon: FileText,
      onClick: handlePurchaseHistory,
    },
    {
      title: "సహాయం",
      icon: HelpCircle,
      onClick: handleHelp,
    },
    {
      title: "లాగ్ అవుట్",
      icon: LogOut,
      onClick: handleSignOut,
    },
  ];

  return (
    <Sidebar className="w-64 bg-sidebar border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground text-lg font-semibold mb-4">
            మెనూ
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-base">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}