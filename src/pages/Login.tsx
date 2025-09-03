import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "అకౌంట్ సృష్టించబడింది!",
          description: "మీ ఇమెయిల్‌ను వెరిఫై చేయండి",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "విజయవంతంగా లాగిన్ అయ్యారు!",
          description: "డాష్‌బోర్డ్‌కు వెళ్లుతున్నాము...",
        });
        
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "లోపం",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            {isSignUp ? "అకౌంట్ సృష్టించండి" : "లాగిన్"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp 
              ? "మీ వివరాలతో కొత్త అకౌంట్ సృష్టించండి" 
              : "మీ అకౌంట్‌లోకి ప్రవేశించండి"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                ఇమెయిల్
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="మీ ఇమెయిల్ ఎంటర్ చేయండి"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                పాస్‌వర్డ్
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="మీ పాస్‌వర్డ్ ఎంటర్ చేయండి"
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
                ? "దయచేసి వేచివుండండి..." 
                : isSignUp 
                  ? "అకౌంట్ సృష్టించండి" 
                  : "లాగిన్"
              }
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp 
                ? "ఇప్పటికే అకౌంట్ ఉందా? లాగిన్ చేయండి" 
                : "అకౌంట్ లేదా? సృష్టించండి"
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;