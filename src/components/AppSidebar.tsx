import { User, FileText, HelpCircle, LogOut, Home, CreditCard, Users, Settings, Languages, BarChart3, Calendar, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AppSidebarProps {
  onClose: () => void;
}

export function AppSidebar({ onClose }: AppSidebarProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [language, setLanguage] = useState<'te' | 'en'>('te');

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
      title: language === 'te' ? "సహాయం" : "Help",
      description: language === 'te' ? "సహాయం పేజీ త్వరలో వస్తుంది" : "Help page coming soon",
    });
    onClose();
  };

  const handleDashboard = () => {
    navigate('/');
    onClose();
  };

  const handleCustomers = () => {
    toast({
      title: language === 'te' ? "కస్టమర్లు" : "Customers",
      description: language === 'te' ? "కస్టమర్ల పేజీ త్వరలో వస్తుంది" : "Customers page coming soon",
    });
    onClose();
  };

  const handleReports = () => {
    toast({
      title: language === 'te' ? "రిపోర్ట్‌లు" : "Reports",
      description: language === 'te' ? "రిపోర్ట్‌ల పేజీ త్వరలో వస్తుంది" : "Reports page coming soon",
    });
    onClose();
  };

  const handleSettings = () => {
    toast({
      title: language === 'te' ? "సెట్టింగ్‌లు" : "Settings",
      description: language === 'te' ? "సెట్టింగ్‌ల పేజీ త్వరలో వస్తుంది" : "Settings page coming soon",
    });
    onClose();
  };

  const handleNotifications = () => {
    toast({
      title: language === 'te' ? "నోటిఫికేషన్‌లు" : "Notifications",
      description: language === 'te' ? "నోటిఫికేషన్‌ల పేజీ త్వరలో వస్తుంది" : "Notifications page coming soon",
    });
    onClose();
  };

  const handleCalendar = () => {
    toast({
      title: language === 'te' ? "క్యాలెండర్" : "Calendar",
      description: language === 'te' ? "క్యాలెండర్ పేజీ త్వరలో వస్తుంది" : "Calendar page coming soon",
    });
    onClose();
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'te' ? 'en' : 'te');
    toast({
      title: language === 'te' ? "Language changed to English" : "భాష తెలుగుకు మార్చబడింది",
      description: language === 'te' ? "App language switched to English" : "అప్లికేషన్ భాష తెలుగుకు మార్చబడింది",
    });
  };

  const mainMenuItems = [
    {
      title: language === 'te' ? "డాష్‌బోర్డ్" : "Dashboard",
      icon: Home,
      onClick: handleDashboard,
    },
    {
      title: language === 'te' ? "కస్టమర్లు" : "Customers", 
      icon: Users,
      onClick: handleCustomers,
    },
    {
      title: language === 'te' ? "రిపోర్ట్‌లు" : "Reports",
      icon: BarChart3,
      onClick: handleReports,
    },
    {
      title: language === 'te' ? "క్యాలెండర్" : "Calendar",
      icon: Calendar,
      onClick: handleCalendar,
    },
    {
      title: language === 'te' ? "నోటిఫికేషన్‌లు" : "Notifications",
      icon: Bell,
      onClick: handleNotifications,
    },
  ];

  const accountMenuItems = [
    {
      title: language === 'te' ? "ప్రొఫైల్" : "Profile",
      icon: User,
      onClick: handleProfile,
    },
    {
      title: language === 'te' ? "కొనుగోలు చరిత్ర" : "Purchase History",
      icon: CreditCard,
      onClick: handlePurchaseHistory,
    },
    {
      title: language === 'te' ? "సెట్టింగ్‌లు" : "Settings",
      icon: Settings,
      onClick: handleSettings,
    },
    {
      title: language === 'te' ? "సహాయం" : "Help",
      icon: HelpCircle,
      onClick: handleHelp,
    },
  ];

  return (
    <div className="w-full h-full bg-sidebar text-sidebar-foreground">
      <Sidebar className="w-64 bg-sidebar border-r border-sidebar-border shadow-lg">
        <SidebarContent className="bg-sidebar">
         {/* Language Toggle */}
         <div className="p-4 border-b border-sidebar-border bg-sidebar-accent">
           <Button
             onClick={toggleLanguage}
             variant="outline"
             size="sm"
             className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground border-sidebar-primary font-medium"
           >
             <Languages className="h-4 w-4 mr-2" />
             {language === 'te' ? 'English' : 'తెలుగు'}
           </Button>
         </div>

        {/* Main Menu */}
        <SidebarGroup>
           <SidebarGroupLabel className="text-sidebar-foreground text-lg font-semibold mb-4 px-4">
             {language === 'te' ? 'ప్రధాన మెనూ' : 'Main Menu'}
           </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-4">
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors font-medium"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-base">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

         <hr className="mx-4 my-4 border-sidebar-border" />

        {/* Account Menu */}
        <SidebarGroup>
           <SidebarGroupLabel className="text-sidebar-foreground text-lg font-semibold mb-4 px-4">
             {language === 'te' ? 'ఖాతా' : 'Account'}
           </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-4">
              {accountMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors font-medium"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-base">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <hr className="mx-4 my-4 border-sidebar-border" />

        {/* Logout */}
        <div className="p-4">
          <Button
            onClick={handleSignOut}
            variant="destructive"
            className="w-full font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {language === 'te' ? 'లాగ్ అవుట్' : 'Log Out'}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
    </div>
  );
}