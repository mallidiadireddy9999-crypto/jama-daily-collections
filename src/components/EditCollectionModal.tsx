import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  amount: number;
  collection_date: string;
  notes: string;
  loan_id: string;
}

interface EditCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection | null;
  onCollectionUpdated: () => void;
}

const EditCollectionModal = ({ isOpen, onClose, collection, onCollectionUpdated }: EditCollectionModalProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    amount: "",
    collectionDate: new Date(),
    notes: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (collection) {
      setFormData({
        amount: collection.amount.toString(),
        collectionDate: new Date(collection.collection_date),
        notes: collection.notes || ""
      });
    }
  }, [collection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !collection) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('collections')
        .update({
          amount: parseFloat(formData.amount),
          collection_date: formData.collectionDate.toISOString().split('T')[0],
          notes: formData.notes
        })
        .eq('id', collection.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: t("విజయవంతం", "Success"),
        description: t("చెల్లింపు వివరాలు అప్‌డేట్ చేయబడ్డాయి", "Payment details updated successfully"),
      });

      onCollectionUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating collection:', error);
      toast({
        title: t("లోపం", "Error"),
        description: t("చెల్లింపు అప్‌డేట్ చేయడంలో లోపం", "Error updating payment"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !collection) return;
    
    if (!confirm(t("ఈ చెల్లింపును తొలగించాలని మీరు ఖచ్చితంగా అనుకుంటున్నారా?", "Are you sure you want to delete this payment?"))) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collection.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: t("విజయవంతం", "Success"),
        description: t("చెల్లింపు తొలగించబడింది", "Payment deleted successfully"),
      });

      onCollectionUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error deleting collection:', error);
      toast({
        title: t("లోపం", "Error"),
        description: t("చెల్లింపు తొలగించడంలో లోపం", "Error deleting payment"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("చెల్లింపు వివరాలు సవరించండి", "Edit Payment Details")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">{t("చెల్లింపు మొత్తం (₹)", "Payment Amount (₹)")}</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder={t("చెల్లింపు మొత్తం నమోదు చేయండి", "Enter payment amount")}
              required
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("చెల్లింపు తేదీ", "Payment Date")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.collectionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.collectionDate ? format(formData.collectionDate, "PPP") : <span>{t("తేదీ ఎంచుకోండి", "Pick a date")}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.collectionDate}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, collectionDate: date }))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("గమనికలు", "Notes")}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={t("గమనికలు నమోదు చేయండి (ఐచ్ఛికం)", "Enter notes (optional)")}
              rows={3}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
              disabled={loading}
            >
              {t("తొలగించు", "Delete")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {t("రద్దు", "Cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? t("అప్‌డేట్ అవుతోంది...", "Updating...") : t("అప్‌డేట్ చేయండి", "Update")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCollectionModal;