import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Save, User, Phone, IndianRupee, Calendar, Scissors, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AddLoanFormProps {
  onBack: () => void;
  onSave?: (loan: any) => void;
}

const AddLoanForm = ({ onBack, onSave }: AddLoanFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    principalAmount: '',
    disbursementType: 'full', // 'full' or 'cutting'
    cuttingAmount: '',
    repaymentType: 'daily',
    installmentAmount: '',
    duration: '',
    durationUnit: 'days' // 'days', 'weeks', 'months'
  });

  // Auto-calculated values
  const disbursedAmount = formData.disbursementType === 'full' 
    ? parseFloat(formData.principalAmount) || 0
    : (parseFloat(formData.principalAmount) || 0) - (parseFloat(formData.cuttingAmount) || 0);

  const totalCollection = (parseFloat(formData.installmentAmount) || 0) * (parseFloat(formData.duration) || 0);
  
  const profitInterest = totalCollection - disbursedAmount;
  
  // Calculate interest rate as annual percentage
  const durationInDays = formData.durationUnit === 'days' ? parseInt(formData.duration) || 0 :
                        formData.durationUnit === 'weeks' ? (parseInt(formData.duration) || 0) * 7 :
                        (parseInt(formData.duration) || 0) * 30;
  
  const interestRate = disbursedAmount > 0 && durationInDays > 0 
    ? (profitInterest / disbursedAmount) * (365 / durationInDays) * 100 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a loan",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // First, create customer record
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert([
          {
            customer_name: formData.customerName,
            customer_mobile: formData.mobileNumber,
            created_by: user.id
          }
        ])
        .select()
        .single();

      if (customerError) throw customerError;

      // Then, save loan with customer reference
      const { data, error } = await supabase
        .from('loans')
        .insert([
          {
            user_id: user.id,
            customer_id: customerData.id,
            customer_name: formData.customerName, // Keep for compatibility
            customer_mobile: formData.mobileNumber, // Keep for compatibility
            amount: parseFloat(formData.principalAmount),
            disbursement_type: formData.disbursementType,
            cutting_amount: parseFloat(formData.cuttingAmount) || 0,
            disbursed_amount: disbursedAmount,
            repayment_type: formData.repaymentType,
            installment_amount: parseFloat(formData.installmentAmount),
            duration_months: parseInt(formData.duration),
            duration_unit: formData.durationUnit,
            total_collection: totalCollection,
            profit_interest: profitInterest,
            interest_rate: parseFloat(interestRate.toFixed(2)),
            status: 'active'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Loan added successfully",
      });

      // Call onSave callback if provided (for parent component to handle)
      if (onSave) {
        onSave(data);
      }

      // Reset form
      setFormData({
        customerName: '',
        mobileNumber: '',
        principalAmount: '',
        disbursementType: 'full',
        cuttingAmount: '',
        repaymentType: 'daily',
        installmentAmount: '',
        duration: '',
        durationUnit: 'days'
      });

      // Go back to previous screen
      onBack();

    } catch (error) {
      console.error('Error adding loan:', error);
      toast({
        title: "Error",
        description: "Failed to add loan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-card p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="default" size="icon" onClick={onBack} className="shadow-lg">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add New Loan</h1>
          <p className="text-sm text-muted-foreground">కొత్త లోన్ జోడించండి</p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Name */}
          <div className="space-y-2">
            <Label htmlFor="customerName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Name / కస్టమర్ పేరు
            </Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="Enter customer name"
              required
              className="h-12 text-lg"
            />
          </div>

          {/* Mobile Number */}
          <div className="space-y-2">
            <Label htmlFor="mobileNumber" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Mobile Number / మొబైల్ నంబర్
            </Label>
            <Input
              id="mobileNumber"
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
              placeholder="Enter mobile number"
              required
              className="h-12 text-lg"
            />
          </div>

          {/* Principal Amount */}
          <div className="space-y-2">
            <Label htmlFor="principalAmount" className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Principal Amount (Sanctioned) / ప్రిన్సిపల్ మొత్తం
            </Label>
            <Input
              id="principalAmount"
              type="number"
              value={formData.principalAmount}
              onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
              placeholder="Enter principal amount"
              required
              className="h-12 text-lg"
            />
          </div>

          {/* Disbursement Type */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Disbursement Type / డిస్బర్స్మెంట్ రకం
            </Label>
            <RadioGroup
              value={formData.disbursementType}
              onValueChange={(value) => setFormData({ ...formData, disbursementType: value })}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full">Full (No Cutting) / పూర్తి</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cutting" id="cutting" />
                <Label htmlFor="cutting">With Cutting / కటింగ్ తో</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Cutting Amount (conditional) */}
          {formData.disbursementType === 'cutting' && (
            <div className="space-y-2">
              <Label htmlFor="cuttingAmount" className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Cutting Amount / కటింగ్ మొత్తం
              </Label>
              <Input
                id="cuttingAmount"
                type="number"
                value={formData.cuttingAmount}
                onChange={(e) => setFormData({ ...formData, cuttingAmount: e.target.value })}
                placeholder="Enter cutting amount"
                required
                className="h-12 text-lg"
              />
            </div>
          )}

          {/* Disbursed Amount (auto-calculated) */}
          {formData.principalAmount && (
            <Card className="p-4 bg-gradient-success">
              <div className="text-center">
                <p className="text-sm text-success-foreground/80">Disbursed Amount / డిస్బర్స్డ్ మొత్తం</p>
                <p className="text-xl font-bold text-success-foreground">
                  ₹{disbursedAmount.toLocaleString()}
                </p>
              </div>
            </Card>
          )}

          {/* Repayment Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Repayment Type / తిరిగి చెల్లింపు రకం
            </Label>
            <Select value={formData.repaymentType} onValueChange={(value) => setFormData({ ...formData, repaymentType: value })}>
              <SelectTrigger className="h-12 text-lg">
                <SelectValue placeholder="Select repayment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily / రోజువారీ</SelectItem>
                <SelectItem value="weekly">Weekly / వారానికి</SelectItem>
                <SelectItem value="monthly">Monthly / నెలకు</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Installment Amount */}
          <div className="space-y-2">
            <Label htmlFor="installmentAmount" className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Installment Amount / కిస్తు మొత్తం
            </Label>
            <Input
              id="installmentAmount"
              type="number"
              value={formData.installmentAmount}
              onChange={(e) => setFormData({ ...formData, installmentAmount: e.target.value })}
              placeholder="Enter installment amount"
              required
              className="h-12 text-lg"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Duration / వ్యవధి
            </Label>
            <div className="flex gap-3">
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Enter duration"
                required
                className="h-12 text-lg flex-1"
              />
              <Select value={formData.durationUnit} onValueChange={(value) => setFormData({ ...formData, durationUnit: value })}>
                <SelectTrigger className="h-12 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Total Collection (auto-calculated) */}
          {formData.installmentAmount && formData.duration && (
            <Card className="p-4 bg-gradient-warning">
              <div className="text-center">
                <p className="text-sm text-warning-foreground/80">Total Collection / మొత్తం సేకరణ</p>
                <p className="text-xl font-bold text-warning-foreground">
                  ₹{totalCollection.toLocaleString()}
                </p>
              </div>
            </Card>
          )}

          {/* Profit/Interest (auto-calculated) */}
          {totalCollection > 0 && disbursedAmount > 0 && (
            <Card className="p-4 bg-gradient-primary">
              <div className="text-center">
                <p className="text-sm text-primary-foreground/80">Profit / Interest / లాభం</p>
                <p className="text-xl font-bold text-primary-foreground">
                  ₹{profitInterest.toLocaleString()}
                </p>
                <p className="text-xs text-primary-foreground/70 mt-1">
                  Interest Rate: {interestRate.toFixed(2)}% per annum
                </p>
              </div>
            </Card>
          )}

          {/* Submit Button */}
          <Button type="submit" variant="money" size="xl" className="w-full" disabled={loading}>
            <Save className="h-5 w-5 mr-2" />
            {loading ? "Saving..." : "Save Loan / లోన్ సేవ్ చేయండి"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AddLoanForm;