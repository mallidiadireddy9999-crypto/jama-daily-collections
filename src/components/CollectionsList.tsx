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
    <div className="min-h-screen bg-gradient-card pb-24">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="default" size="icon" onClick={onBack} className="shadow-lg">
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

      </div>
      
      {/* Sticky Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg z-10">
        <div className="p-4">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("వసూలు రేట్", "Collection Rate")}</p>
                <p className="text-lg font-bold text-success">
                  {collections.length > 0 ? Math.round(collections.length / 10 * 100) : 0}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("మొత్తం వసూలు", "Total Collections")}</p>
                <p className="text-lg font-bold text-primary">
                  {collections.length}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("సగటు వసూలు", "Average Collection")}</p>
                <p className="text-lg font-bold text-warning">
                  ₹{collections.length > 0 ? Math.round(totalAmount / collections.length).toLocaleString() : 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("మొత్తం వసూలైనది", "Total Collected")}</p>
                <p className="text-lg font-bold text-success">
                  ₹{totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionsList;