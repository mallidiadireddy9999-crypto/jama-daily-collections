import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, IndianRupee, Clock } from "lucide-react";

interface LoanCardProps {
  loan: {
    id: string;
    customerName: string;
    phone: string;
    amount: number;
    dailyPayment: number;
    daysRemaining: number;
    status: 'active' | 'completed' | 'overdue';
    lastPayment: string;
  };
}

const LoanCard = ({ loan }: LoanCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'completed': return 'bg-primary text-primary-foreground';
      case 'overdue': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'overdue': return 'Overdue';
      default: return 'Unknown';
    }
  };

  return (
    <Card className="p-4 shadow-card hover:shadow-money transition-all duration-200">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{loan.customerName}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              {loan.phone}
            </div>
          </div>
          <Badge className={getStatusColor(loan.status)}>
            {getStatusText(loan.status)}
          </Badge>
        </div>

        {/* Loan Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <IndianRupee className="h-3 w-3" />
              <span>Loan Amount</span>
            </div>
            <p className="font-semibold text-foreground">₹{loan.amount.toLocaleString()}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Daily Payment</span>
            </div>
            <p className="font-semibold text-primary">₹{loan.dailyPayment.toLocaleString()}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Days Remaining</span>
            <span className="font-medium text-foreground">{loan.daysRemaining} days</span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-success h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, 100 - (loan.daysRemaining * 2))}%` }}
            />
          </div>
        </div>

        {/* Last Payment */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Last Payment: {loan.lastPayment}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button variant="collect" size="sm" className="w-full">
          Collect Today's Payment
        </Button>
      </div>
    </Card>
  );
};

export default LoanCard;