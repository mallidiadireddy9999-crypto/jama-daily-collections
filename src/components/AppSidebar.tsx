import { Home, Users, DollarSign, Calendar, FileText, PlusCircle, TrendingUp, LogOut, User, Settings, Bell, Shield, Megaphone } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AppSidebarProps {
  onNavigate: (view: string) => void;
  userRole: string | null;
}

export function AppSidebar({ onNavigate, userRole }: AppSidebarProps) {
  const { t, language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: t("విజయవంతంగా లాగ్ అవుట్ అయ్యారు", "Successfully logged out"),
        description: t("మళ్లీ లాగిన్ చేయడానికి సైన్ ఇన్ పేజీకి వెళ్లండి", "Go to sign in page to login again"),
      });
    } catch (error) {
      toast({
        title: t("లోపం", "Error"),
        description: t("లాగ్ అవుట్ చేయడంలో లోపం", "Error signing out"),
        variant: "destructive",
      });
    }
  };

  // Super Admin menu items
  const superAdminMenuItems = [
    {
      title: t("డాష్‌బోర్డ్", "Dashboard"),
      icon: Home,
      view: "dashboard"
    },
    {
      title: t("యూజర్ మేనేజ్‌మెంట్", "User Management"),
      icon: Users,
      view: "user-management"
    },
    {
      title: t("యాడ్స్ మేనేజ్‌మెంట్", "Ads Management"),
      icon: Megaphone,
      view: "ads-management"
    },
    {
      title: t("రిపోర్ట్‌లు", "Reports"),
      icon: FileText,
      view: "user-reports"
    },
    {
      title: t("నోటిఫికేషన్‌లు", "Notifications"),
      icon: Bell,
      view: "notifications"
    }
  ];

  // Jama User menu items (existing functionality)
  const jamaUserMenuItems = [
    {
      title: t("డాష్‌బోర్డ్", "Dashboard"),
      icon: Home,
      view: "dashboard"
    },
    {
      title: t("క్రియాశీల లోన్‌లు", "Active Loans"),
      icon: Users,
      view: "active-loans"
    },
    {
      title: t("బాకీ మొత్తాలు", "Pending Balance"),
      icon: DollarSign,
      view: "pending-balance"
    },
    {
      title: t("నేడు కొత్త లోన్‌లు", "New Loans Today"),
      icon: PlusCircle,
      view: "new-loans"
    },
    {
      title: t("వసూలు", "Collections"),
      icon: Calendar,
      view: "collections"
    },
    {
      title: t("రిపోర్ట్‌లు", "Reports"),
      icon: FileText,
      view: "reports"
    }
  ];

  const menuItems = userRole === 'super_admin' ? superAdminMenuItems : jamaUserMenuItems;

  const toggleLanguage = () => {
    setLanguage(language === 'te' ? 'en' : 'te');
  };

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <img 
              src="/lovable-uploads/5687e4de-9f9a-4de1-8c5c-92952cc9cd45.png" 
              alt="JAMA" 
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">JAMA</h1>
            <p className="text-xs text-muted-foreground">
              {userRole === 'super_admin' 
                ? t("సూపర్ అడ్మిన్", "Super Admin")
                : t("రోజువారీ వసూలు", "Daily Collection")
              }
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-4">
        <SidebarMenu className="space-y-1">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.view}>
              <SidebarMenuButton
                onClick={() => onNavigate(item.view)}
                className="w-full justify-start space-x-3 py-3 px-3 rounded-lg hover:bg-muted transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {/* Language Toggle */}
        <div className="mt-6 pt-4 border-t border-border">
          <Button
            onClick={toggleLanguage}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {language === 'te' ? 'English' : 'తెలుగు'}
          </Button>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center space-x-2 px-2 py-1 text-sm text-muted-foreground">
              {userRole === 'super_admin' ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
              <div className="flex-1 truncate">
                <div className="truncate">{user?.email}</div>
                {userRole === 'super_admin' && (
                  <div className="text-xs text-amber-600 font-medium">Super Admin</div>
                )}
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button 
              variant="ghost" 
              onClick={handleSignOut}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("లాగ్ అవుట్", "Sign Out")}
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}