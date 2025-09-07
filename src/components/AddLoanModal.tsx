import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, User, Phone, IndianRupee, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

interface AddLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (loan: any) => void;
}

const AddLoanModal = ({ open, onOpenChange, onSave }: AddLoanModalProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    amount: '',
    duration: '30'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const loan = {
      id: Date.now().toString(),
      customerName: formData.customerName,
      phone: formData.phone,
      amount: parseInt(formData.amount),
      duration: parseInt(formData.duration),
      dailyPayment: Math.ceil(parseInt(formData.amount) / parseInt(formData.duration)),
      daysRemaining: parseInt(formData.duration),
      status: 'active' as const,
      lastPayment: 'Not yet',
      date: new Date().toISOString().split('T')[0]
    };
    
    onSave(loan);
    
    // Reset form and close modal
    setFormData({
      customerName: '',
      phone: '',
      amount: '',
      duration: '30'
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {t("కొత్త లోన్ జోడించండి", "Add New Loan")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Name */}
          <div className="space-y-2">
            <Label htmlFor="customerName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("పేరు", "Name")}
            </Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder={t("కస్టమర్ పేరు", "Customer Name")}
              required
              className="h-11"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {t("మొబైల్ నంబర్", "Mobile Number")}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={t("మొబైల్ నంబర్", "Mobile Number")}
              required
              className="h-11"
            />
          </div>

          {/* Principal Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              {t("ప్రధాన మొత్తం", "Principal Amount")}
            </Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder={t("ప్రధాన మొత్తం", "Principal Amount")}
              required
              className="h-11"
            />
          </div>

          {/* Tenure */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t("వ్యవధి (రోజులు)", "Duration (Days)")}
            </Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder={t("వ్యవధి రోజులలో", "Duration in days")}
              required
              className="h-11"
            />
          </div>

          {/* Calculated Daily Payment */}
          {formData.amount && formData.duration && (
            <Card className="p-3 bg-gradient-success">
              <div className="text-center">
                <p className="text-xs text-success-foreground/80">{t("రోజువారీ చెల్లింపు", "Daily Payment")}</p>
                <p className="text-lg font-bold text-success-foreground">
                  ₹{Math.ceil(parseInt(formData.amount) / parseInt(formData.duration)).toLocaleString()}
                </p>
              </div>
            </Card>
          )}

          {/* Submit Button */}
          <Button type="submit" variant="money" size="lg" className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {t("లోన్ సేవ్ చేయండి", "Save Loan")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLoanModal;