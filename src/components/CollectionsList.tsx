import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, IndianRupee, Clock, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Collection {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  timestamp: string;
  time: string;
}

interface CollectionsListProps {
  onBack: () => void;
  collections: Collection[];
}

const CollectionsList = ({ onBack, collections }: CollectionsListProps) => {
  const { t } = useLanguage();
  const totalAmount = collections.reduce((sum, collection) => sum + collection.amount, 0);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('te-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-card p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("నేటి వసూలు", "Today's Collections")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("మొత్తం వసూలు:", "Total Collections:")} ₹{totalAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Total Collections Summary */}
      <Card className="p-4 shadow-card bg-gradient-success">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <IndianRupee className="h-6 w-6 text-success-foreground" />
            <span className="text-2xl font-bold text-success-foreground">
              ₹{totalAmount.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-success-foreground/80">
            {t("మొత్తం", "Total")} {collections.length} {t("వసూలు", "collections")}
          </p>
        </div>
      </Card>

      {/* Collections List */}
      <div className="space-y-3">
        {collections.length === 0 ? (
          <Card className="p-6 text-center shadow-card">
            <p className="text-muted-foreground">{t("నేడు వసూలు లేవు", "No collections today")}</p>
          </Card>
        ) : (
          collections.map((collection) => (
            <Card key={collection.id} className="p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {collection.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {collection.customerId}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-success">
                    ₹{collection.amount.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTime(collection.timestamp)}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Summary Footer */}
      {collections.length > 0 && (
        <Card className="p-4 shadow-card bg-muted">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("మొత్తం వసూలు:", "Total Collections:")}</span>
              <span className="font-medium text-foreground">{collections.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("మొత్తం మొత్తం:", "Total Amount:")}</span>
              <span className="font-medium text-success">₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("సగటు వసూలు:", "Average Collection:")}</span>
              <span className="font-medium text-primary">
                ₹{Math.round(totalAmount / collections.length).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CollectionsList;