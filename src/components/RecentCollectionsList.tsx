import { useState, useEffect } from "react";
import { ArrowLeft, Edit2, IndianRupee, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import EditCollectionModal from "./EditCollectionModal";

interface Collection {
  id: string;
  amount: number;
  collection_date: string;
  notes: string;
  loan_id: string;
  loan: {
    customer_name: string;
    customer_mobile: string;
  };
}

interface RecentCollectionsListProps {
  onBack: () => void;
}

const RecentCollectionsList = ({ onBack }: RecentCollectionsListProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  const fetchRecentCollections = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          loan:loans(customer_name, customer_mobile)
        `)
        .eq('user_id', user.id)
        .order('collection_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setCollections(data || []);
    } catch (error: any) {
      console.error('Error fetching recent collections:', error);
      toast({
        title: t("లోపం", "Error"),
        description: t("ఇటీవలి వసూలు డేటా లోడ్ చేయడంలో లోపం", "Error loading recent collections data"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentCollections();
  }, [user]);

  const totalCollected = collections.reduce((sum, collection) => sum + Number(collection.amount), 0);

  return (
    <>
      <div className="min-h-screen bg-gradient-card p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{t("ఇటీవలి వసూలు", "Recent Collections")}</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? t("లోడ్ అవుతోంది...", "Loading...") : t(`మొత్తం ${collections.length} చెల్లింపులు`, `Total ${collections.length} payments`)}
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="p-4 bg-success/10 border-success/20">
          <div className="flex items-center space-x-3">
            <IndianRupee className="h-6 w-6 text-success" />
            <div>
              <p className="font-semibold text-foreground">{t("మొత్తం వసూలు", "Total Collections")}</p>
              <p className="text-2xl font-bold text-success">₹{totalCollected.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Collections List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{t("వసూలు వివరాలు", "Collection Details")}</h2>
          
          {loading ? (
            <Card className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-muted-foreground">{t("లోడ్ అవుతోంది...", "Loading...")}</p>
            </Card>
          ) : collections.length === 0 ? (
            <Card className="p-6 text-center">
              <IndianRupee className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t("ఇటీవలి వసూలు లేవు", "No recent collections")}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {collections.map((collection) => (
                <Card key={collection.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">
                          {collection.loan?.customer_name || "Unknown Customer"}
                        </span>
                        {collection.loan?.customer_mobile && (
                          <span className="text-sm text-muted-foreground">
                            ({collection.loan.customer_mobile})
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center space-x-1">
                          <IndianRupee className="h-3 w-3 text-success" />
                          <span className="text-muted-foreground">{t("మొత్తం:", "Amount:")}</span>
                          <span className="font-bold text-success">
                            ₹{Number(collection.amount).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{t("తేదీ:", "Date:")}</span>
                          <span className="text-foreground">
                            {new Date(collection.collection_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {collection.notes && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">{t("గమనికలు:", "Notes:")}</span>
                          <span className="ml-1 text-foreground">{collection.notes}</span>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCollection(collection)}
                      className="ml-2"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditCollectionModal
        isOpen={!!editingCollection}
        onClose={() => setEditingCollection(null)}
        collection={editingCollection}
        onCollectionUpdated={() => {
          fetchRecentCollections();
          setEditingCollection(null);
        }}
      />
    </>
  );
};

export default RecentCollectionsList;