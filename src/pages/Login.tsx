import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, Lock, Eye, EyeOff, Users, Languages } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralId, setReferralId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, toggleLanguage, language } = useLanguage();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);

    try {
      if (isSignUp) {
        // For signup, use email directly
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              referral_id: referralId
            }
          }
        });
        
        if (error) throw error;
        
        toast({
          title: t("అకౌంట్ సృష్టించబడింది!", "Account Created!"),
          description: t(`ఇమెయిల్ ${email} తో అకౌంట్ సృష్టించబడింది`, `Account created with email ${email}`),
        });
      } else {
        // For login, use email
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        // Check if user account is active after successful login
        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_active')
            .eq('user_id', data.user.id)
            .maybeSingle();
            
          if (profileError) {
            console.error('Error checking profile status:', profileError);
          } else if (profile && profile.is_active === false) {
            // Sign out immediately if account is deactivated
            await supabase.auth.signOut();
            throw new Error("Your account has been deactivated. Please contact administrator for assistance.");
          }
        }
        
        toast({
          title: t("విజయవంతంగా లాగిన్ అయ్యారు!", "Login Successful!"),
          description: t("డాష్‌బోర్డ్‌కు వెళ్లుతున్నాము...", "Redirecting to dashboard..."),
        });
        
        navigate("/");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = error.message;
      
      // Check for specific error types
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        errorMessage = "Cannot connect to server. Your Supabase project may be paused or there's a network issue. Please check your Supabase dashboard.";
      }
      
      toast({
        title: t("లోపం", "Error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      toast({
        title: t("ఇమెయిల్ పంపబడింది", "Email Sent"),
        description: t("పాస్‌వర్డ్ రీసెట్ లింక్ మీ ఇమెయిల్‌కు పంపబడింది", "Password reset link has been sent to your email"),
      });
      
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: t("లోపం", "Error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50 relative">
        <CardHeader className="space-y-4 text-center">
          {/* Language Toggle */}
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="gap-2"
            >
              <Languages className="h-4 w-4" />
              {language === 'te' ? 'EN' : 'తె'}
            </Button>
          </div>
          
          {/* Logo Section */}
          <div className="flex justify-center">
            <div className="bg-gradient-money px-6 py-3 rounded-lg shadow-money flex items-center gap-3">
              <img src="/lovable-uploads/6931d901-421c-4070-833d-a383481866ec.png" alt="Wallet" className="h-10 w-10" />
              <h1 className="text-xl font-bold text-primary-foreground">
                JAMA <span className="text-lg">{t("చేయి", "App")}</span>
              </h1>
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold text-foreground">
            {isSignUp ? t("అకౌంట్ సృష్టించండి", "Create Account") : t("లాగిన్", "Login")}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp 
              ? t("మీ వివరాలతో కొత్త అకౌంట్ సృష్టించండి", "Create a new account with your details") 
              : t("మీ అకౌంట్‌లోకి ప్రవేశించండి", "Sign in to your account")
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp ? (
              /* Sign Up Form */
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t("ఇమెయిల్", "Email")}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("మీ ఇమెయిల్ ఎంటర్ చేయండి", "Enter your email")}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referralId" className="text-sm font-medium">
                    {t("రిఫరల్ ID (ఐచ్ఛికం)", "Referral ID (Optional)")}
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="referralId"
                      type="text"
                      value={referralId}
                      onChange={(e) => setReferralId(e.target.value)}
                      placeholder={t("రిఫరల్ ID ఎంటర్ చేయండి", "Enter referral ID")}
                      className="pl-10"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Login Form */
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("ఇమెయిల్", "Email")}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("మీ ఇమెయిల్ ఎంటర్ చేయండి", "Enter your email")}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {t("పాస్‌వర్డ్", "Password")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("మీ పాస్‌వర్డ్ ఎంటర్ చేయండి", "Enter your password")}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              variant="default"
            >
              {isLoading 
                ? t("దయచేసి వేచివుండండి...", "Please wait...") 
                : isSignUp 
                  ? t("అకౌంట్ సృష్టించండి", "Create Account") 
                  : t("లాగిన్", "Login")
              }
            </Button>

            {!isSignUp && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm"
                >
                  {t("పాస్‌వర్డ్ మర్చిపోయారా?", "Forgot Password?")}
                </Button>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp 
                ? t("ఇప్పటికే అకౌంట్ ఉందా? లాగిన్ చేయండి", "Already have an account? Login") 
                : t("అకౌంట్ లేదా? సృష్టించండి", "No account? Create one")
              }
            </button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("పాస్‌వర్డ్ రీసెట్ చేయండి", "Reset Password")}</DialogTitle>
            <DialogDescription>
              {t("మీ ఇమెయిల్ చిరునామాను నమోదు చేయండి మరియు మేము మీకు పాస్‌వర్డ్ రీసెట్ లింక్ పంపుతాము", "Enter your email address and we'll send you a password reset link")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t("ఇమెయిల్", "Email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder={t("మీ ఇమెయిల్ ఎంటర్ చేయండి", "Enter your email")}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("పంపుతోంది...", "Sending...") : t("రీసెట్ లింక్ పంపండి", "Send Reset Link")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;