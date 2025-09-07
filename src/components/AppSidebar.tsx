import { User, FileText, HelpCircle, LogOut, Home, CreditCard, Users, Settings, Languages, BarChart3, Calendar, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    console.log("Reports clicked in sidebar");
    // This will be handled by the dashboard component's handleViewReports
    window.dispatchEvent(new CustomEvent('sidebarNavigate', { detail: 'reports' }));
    console.log("Dispatched sidebarNavigate event with 'reports'");
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
    <div className="h-full w-full bg-background border-r border-border flex flex-col">
      {/* User Info Header */}
      {user && (
        <div className="p-4 border-b border-border bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-foreground">
                {user.email || 'User'}
              </p>
              <p className="text-muted-foreground text-xs">
                {language === 'te' ? 'లాగిన్ అయ్యారు' : 'Logged in'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Language Toggle */}
      <div className="p-4 border-b border-border bg-muted/5">
        <Button
          onClick={toggleLanguage}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Languages className="h-4 w-4 mr-2" />
          {language === 'te' ? 'English' : 'తెలుగు'}
        </Button>
      </div>

      {/* Main Menu */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {language === 'te' ? 'ప్రధాన మెనూ' : 'Main Menu'}
          </h3>
          <div className="space-y-1">
            {mainMenuItems.map((item) => (
              <button
                key={item.title}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-foreground hover:text-foreground transition-colors font-medium text-left"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm">{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        <hr className="mx-4 border-border" />

        {/* Account Menu */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {language === 'te' ? 'ఖాతా' : 'Account'}
          </h3>
          <div className="space-y-1">
            {accountMenuItems.map((item) => (
              <button
                key={item.title}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-foreground hover:text-foreground transition-colors font-medium text-left"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={handleSignOut}
          variant="destructive"
          className="w-full font-medium"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {language === 'te' ? 'లాగ్ అవుట్' : 'Log Out'}
        </Button>
      </div>
    </div>
  );
}