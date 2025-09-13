import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DeactivatedAccount = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-destructive/20">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="bg-destructive/10 p-4 rounded-full">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold text-destructive">
            Account Deactivated
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            మీ అకౌంట్ డీ-యాక్టివేట్ చేయబడింది
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Your account has been temporarily deactivated by the administrator. 
              Please contact support for assistance.
            </p>
            <p className="text-sm text-muted-foreground font-medium">
              మీ అకౌంట్‌ను తిరిగి యాక్టివేట్ చేయాలంటే అడ్మిన్‌ని సంప్రదించండి.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">Contact Support</div>
                <div className="text-muted-foreground">+91 98765 43210</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">Email Support</div>
                <div className="text-muted-foreground">support@jama.app</div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => navigate("/login")}
            variant="outline"
            className="w-full"
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};