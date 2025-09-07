import { User, FileText, HelpCircle, LogOut, Home, CreditCard, Users, Settings, Languages, BarChart3, Calendar, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { language, toggleLanguage, t } = useLanguage();
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
      title: t("కొనుగోలు చరిత్ర", "Purchase History"),
      description: t("కొనుగోలు చరిత్ర త్వరలో వస్తుంది", "Purchase history coming soon"),
    });
    onClose();
  };

  const handleHelp = () => {
    // Navigate to help page (to be implemented)
    toast({
      title: t("సహాయం", "Help"),
      description: t("సహాయం పేజీ త్వరలో వస్తుంది", "Help page coming soon"),
    });
    onClose();
  };

  const handleDashboard = () => {
    navigate('/');
    onClose();
  };

  const handleCustomers = () => {
    toast({
      title: t("కస్టమర్లు", "Customers"),
      description: t("కస్టమర్ల పేజీ త్వరలో వస్తుంది", "Customers page coming soon"),
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
      title: t("సెట్టింగ్‌లు", "Settings"),
      description: t("సెట్టింగ్‌ల పేజీ త్వరలో వస్తుంది", "Settings page coming soon"),
    });
    onClose();
  };

  const handleNotifications = () => {
    toast({
      title: t("నోటిఫికేషన్‌లు", "Notifications"),
      description: t("నోటిఫికేషన్‌ల పేజీ త్వరలో వస్తుంది", "Notifications page coming soon"),
    });
    onClose();
  };

  const handleCalendar = () => {
    toast({
      title: t("క్యాలెండర్", "Calendar"),
      description: t("క్యాలెండర్ పేజీ త్వరలో వస్తుంది", "Calendar page coming soon"),
    });
    onClose();
  };


  const mainMenuItems = [
    {
      title: t("డాష్‌బోర్డ్", "Dashboard"),
      icon: Home,
      onClick: handleDashboard,
    },
    {
      title: t("కస్టమర్లు", "Customers"), 
      icon: Users,
      onClick: handleCustomers,
    },
    {
      title: t("రిపోర్ట్‌లు", "Reports"),
      icon: BarChart3,
      onClick: handleReports,
    },
    {
      title: t("క్యాలెండర్", "Calendar"),
      icon: Calendar,
      onClick: handleCalendar,
    },
    {
      title: t("నోటిఫికేషన్‌లు", "Notifications"),
      icon: Bell,
      onClick: handleNotifications,
    },
  ];

  const accountMenuItems = [
    {
      title: t("ప్రొఫైల్", "Profile"),
      icon: User,
      onClick: handleProfile,
    },
    {
      title: t("కొనుగోలు చరిత్ర", "Purchase History"),
      icon: CreditCard,
      onClick: handlePurchaseHistory,
    },
    {
      title: t("సెట్టింగ్‌లు", "Settings"),
      icon: Settings,
      onClick: handleSettings,
    },
    {
      title: t("సహాయం", "Help"),
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
                 {t('లాగిన్ అయ్యారు', 'Logged in')}
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
            {t('ప్రధాన మెనూ', 'Main Menu')}
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
            {t('ఖాతా', 'Account')}
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
          {t('లాగ్ అవుట్', 'Log Out')}
        </Button>
      </div>
    </div>
  );
}