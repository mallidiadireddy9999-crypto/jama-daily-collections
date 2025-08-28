import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, User, Phone, IndianRupee, Calendar } from "lucide-react";

interface AddLoanFormProps {
  onBack: () => void;
  onSave: (loan: any) => void;
}

const AddLoanForm = ({ onBack, onSave }: AddLoanFormProps) => {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    amount: '',
    repaymentPlan: 'daily',
    duration: '30'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const loan = {
      id: Date.now().toString(),
      customerName: formData.customerName,
      phone: formData.phone,
      amount: parseInt(formData.amount),
      repaymentPlan: formData.repaymentPlan,
      duration: parseInt(formData.duration),
      dailyPayment: Math.ceil(parseInt(formData.amount) / parseInt(formData.duration)),
      daysRemaining: parseInt(formData.duration),
      status: 'active' as const,
      lastPayment: 'Not yet',
      date: new Date().toISOString().split('T')[0]
    };
    
    onSave(loan);
  };

  return (
    <div className="min-h-screen bg-gradient-card p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
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

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number / ఫోన్ నంబర్
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
              required
              className="h-12 text-lg"
            />
          </div>

          {/* Loan Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Loan Amount / లోన్ మొత్తం
            </Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter loan amount"
              required
              className="h-12 text-lg"
            />
          </div>

          {/* Repayment Plan */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Repayment Plan / తిరిగి చెల్లింపు ప్రణాళిక
            </Label>
            <Select value={formData.repaymentPlan} onValueChange={(value) => setFormData({ ...formData, repaymentPlan: value })}>
              <SelectTrigger className="h-12 text-lg">
                <SelectValue placeholder="Select repayment plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily / రోజువారీ</SelectItem>
                <SelectItem value="weekly">Weekly / వారానికి</SelectItem>
                <SelectItem value="monthly">Monthly / నెలకు</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Duration (Days) / వ్యవధి (రోజులు)
            </Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="Enter duration in days"
              required
              className="h-12 text-lg"
            />
          </div>

          {/* Calculated Daily Payment */}
          {formData.amount && formData.duration && (
            <Card className="p-4 bg-gradient-success">
              <div className="text-center">
                <p className="text-sm text-success-foreground/80">Daily Payment Amount</p>
                <p className="text-xl font-bold text-success-foreground">
                  ₹{Math.ceil(parseInt(formData.amount) / parseInt(formData.duration)).toLocaleString()}
                </p>
              </div>
            </Card>
          )}

          {/* Submit Button */}
          <Button type="submit" variant="money" size="xl" className="w-full">
            <Save className="h-5 w-5 mr-2" />
            Save Loan / లోన్ సేవ్ చేయండి
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AddLoanForm;