import { useState, useEffect } from "react";
import { ArrowLeft, Download, Calendar, TrendingUp, Users, IndianRupee, FileText, Database, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReportsPageProps {
  onBack: () => void;
}

export default function ReportsPage({ onBack }: ReportsPageProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("daily-collections");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [dailyCollections, setDailyCollections] = useState<any[]>([]);
  const [allLoans, setAllLoans] = useState<any[]>([]);
  const [customerWiseData, setCustomerWiseData] = useState<any[]>([]);
  const [dailyTotal, setDailyTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    if (activeTab === "daily-collections" && selectedDate) {
      fetchDailyCollections();
    } else if (activeTab === "loan-database") {
      fetchAllLoans();
    } else if (activeTab === "customer-wise") {
      fetchCustomerWiseData();
    }
  }, [activeTab, selectedDate]);

  const fetchDailyCollections = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Fetch collections with loan details and calculate outstanding amounts
      const { data: collections, error } = await supabase
        .from('collections')
        .select(`
          *,
          loans!inner(
            id,
            customer_name, 
            customer_mobile,
            amount
          )
        `)
        .eq('user_id', user.user.id)
        .eq('collection_date', selectedDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate outstanding amounts for each loan
      const enrichedCollections = await Promise.all(
        (collections || []).map(async (collection) => {
          const { data: allCollections, error: collError } = await supabase
            .from('collections')
            .select('amount')
            .eq('loan_id', collection.loans.id)
            .eq('user_id', user.user.id);

          if (collError) throw collError;

          const totalCollected = allCollections?.reduce((sum, coll) => sum + Number(coll.amount), 0) || 0;
          const outstanding = Number(collection.loans.amount) - totalCollected;

          return {
            ...collection,
            outstanding_amount: outstanding
          };
        })
      );

      setDailyCollections(enrichedCollections);
      const total = enrichedCollections.reduce((sum, collection) => sum + Number(collection.amount), 0);
      setDailyTotal(total);

    } catch (error: any) {
      toast({
        title: t("లోపం", "Error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLoans = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: loans, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAllLoans(loans || []);

    } catch (error: any) {
      toast({
        title: t("లోపం", "Error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerWiseData = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Fetch all loans with collections
      const { data: loans, error } = await supabase
        .from('loans')
        .select(`
          *,
          collections(*)
        `)
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate customer wise data
      const customerData = (loans || []).map((loan) => {
        const collections = loan.collections || [];
        const totalCollected = collections.reduce((sum: number, coll: any) => sum + Number(coll.amount), 0);
        const outstanding = Number(loan.amount) - totalCollected;
        
        // Calculate loan timeframe
        const startDate = new Date(loan.start_date);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + (loan.duration_months || 12));
        
        return {
          loan_id: loan.id,
          customer_name: loan.customer_name,
          principal_amount: Number(loan.amount),
          outstanding_amount: outstanding,
          total_collected: totalCollected,
          collections: collections,
          start_date: loan.start_date,
          duration_months: loan.duration_months || 12,
          end_date: endDate.toISOString().split('T')[0],
          status: loan.status
        };
      });

      setCustomerWiseData(customerData);

    } catch (error: any) {
      toast({
        title: t("లోపం", "Error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadDailyCollectionsPDF = () => {
    if (!dailyCollections.length) {
      toast({
        title: t("లోపం", "Error"),
        description: t("డేటా లేదు", "No data available"),
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Add logo
      const logoImg = new Image();
      logoImg.onload = () => {
        // Add logo to top left
        doc.addImage(logoImg, 'PNG', 20, 10, 30, 30);
        
        // Add title
        doc.setFontSize(20);
        doc.text('JAMA - Daily Collections Report', 105, 25, { align: 'center' });
        
        // Add date and summary
        doc.setFontSize(12);
        doc.text(`Date: ${selectedDate}`, 20, 50);
        doc.text(`Total Collections: Rs.${dailyTotal.toLocaleString()}`, 20, 60);
        doc.text(`Number of Collections: ${dailyCollections.length}`, 20, 70);
        
        // Add collections table with customer ID and outstanding amount
        const collectionsData = dailyCollections.map((collection: any, index: number) => [
          `C${String(index + 1).padStart(3, '0')}`,
          collection.loans?.customer_name || 'N/A',
          collection.loans?.customer_mobile || 'N/A',
          `Rs.${Number(collection.amount).toLocaleString()}`,
          `Rs.${Number(collection.outstanding_amount || 0).toLocaleString()}`,
          collection.notes || '-'
        ]);

        autoTable(doc, {
          startY: 85,
          head: [['Customer ID', 'Customer Name', 'Mobile', 'Collected', 'Outstanding', 'Notes']],
          body: collectionsData,
          theme: 'grid',
          styles: { fontSize: 9 },
          headStyles: { fontSize: 10, fillColor: [34, 197, 94] },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
            5: { cellWidth: 40 }
          }
        });

        const filename = `jama-daily-collections-${selectedDate}.pdf`;
        doc.save(filename);
        
        toast({
          title: "PDF Downloaded",
          description: `Report saved as ${filename}`,
        });
      };
      
      logoImg.src = "/lovable-uploads/ff3ffabf-f0ae-4db2-b9ae-0144863bfcf6.png";
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const downloadLoanDatabasePDF = () => {
    if (!allLoans.length) {
      toast({
        title: t("లోపం", "Error"),
        description: t("డేటా లేదు", "No data available"),
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Add logo
      const logoImg = new Image();
      logoImg.onload = () => {
        // Add logo to top left
        doc.addImage(logoImg, 'PNG', 20, 10, 30, 30);
        
        // Add title
        doc.setFontSize(20);
        doc.text('JAMA - Complete Loan Database', 105, 25, { align: 'center' });
        
        // Calculate totals
        const totalAmount = allLoans.reduce((sum, loan) => sum + Number(loan.amount), 0);
        const activeLoans = allLoans.filter(loan => loan.status === 'active').length;
        
        // Add summary
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 50);
        doc.text(`Total Loans: ${allLoans.length}`, 20, 60);
        doc.text(`Active Loans: ${activeLoans}`, 20, 70);
        doc.text(`Total Amount: Rs.${totalAmount.toLocaleString()}`, 20, 80);
        
        // Add loans table with customer ID
        const loansData = allLoans.map((loan: any, index: number) => [
          `L${String(index + 1).padStart(3, '0')}`,
          loan.customer_name || 'N/A',
          loan.customer_mobile || 'N/A',
          `Rs.${Number(loan.amount).toLocaleString()}`,
          `${loan.interest_rate || 0}%`,
          `${loan.duration_months || 0}m`,
          loan.status || 'active',
          loan.start_date || 'N/A'
        ]);

        autoTable(doc, {
          startY: 95,
          head: [['ID', 'Customer', 'Mobile', 'Amount', 'Rate', 'Duration', 'Status', 'Start Date']],
          body: loansData,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fontSize: 9, fillColor: [34, 197, 94] },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 25 },
            2: { cellWidth: 20 },
            3: { cellWidth: 25 },
            4: { cellWidth: 15 },
            5: { cellWidth: 18 },
            6: { cellWidth: 18 },
            7: { cellWidth: 25 }
          }
        });

        const filename = `jama-loan-database-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        
        toast({
          title: "PDF Downloaded",
          description: `Database saved as ${filename}`,
        });
      };
      
      logoImg.src = "/lovable-uploads/ff3ffabf-f0ae-4db2-b9ae-0144863bfcf6.png";
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const downloadCustomerWisePDF = () => {
    if (!customerWiseData.length) {
      toast({
        title: t("లోపం", "Error"),
        description: t("డేటా లేదు", "No data available"),
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Add logo
      const logoImg = new Image();
      logoImg.onload = () => {
        // Add logo to top left
        doc.addImage(logoImg, 'PNG', 20, 10, 30, 30);
        
        // Add title
        doc.setFontSize(20);
        doc.text('JAMA - Customer Wise Report', 105, 25, { align: 'center' });
        
        // Add summary
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 50);
        doc.text(`Total Customers: ${customerWiseData.length}`, 20, 60);
        
        const totalPrincipal = customerWiseData.reduce((sum, customer) => sum + customer.principal_amount, 0);
        const totalOutstanding = customerWiseData.reduce((sum, customer) => sum + customer.outstanding_amount, 0);
        
        doc.text(`Total Principal: Rs.${totalPrincipal.toLocaleString()}`, 20, 70);
        doc.text(`Total Outstanding: Rs.${totalOutstanding.toLocaleString()}`, 20, 80);
        
        // Add customer table
        const customerData = customerWiseData.map((customer: any) => [
          customer.loan_id.substring(0, 8),
          customer.customer_name,
          `Rs.${customer.principal_amount.toLocaleString()}`,
          `Rs.${customer.outstanding_amount.toLocaleString()}`,
          `${customer.collections.length} payments`,
          `${customer.start_date} to ${customer.end_date}`
        ]);

        autoTable(doc, {
          startY: 95,
          head: [['Loan ID', 'Customer', 'Principal', 'Outstanding', 'Payments', 'Timeframe']],
          body: customerData,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fontSize: 9, fillColor: [34, 197, 94] },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 20 },
            5: { cellWidth: 45 }
          }
        });

        const filename = `jama-customer-wise-report-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        
        toast({
          title: "PDF Downloaded",
          description: `Report saved as ${filename}`,
        });
      };
      
      logoImg.src = "/lovable-uploads/ff3ffabf-f0ae-4db2-b9ae-0144863bfcf6.png";
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-card p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("వెనుకకు", "Back")}
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{t("రిపోర్ట్‌లు", "Reports")}</h1>
      </div>

      {/* Reports Tabs */}
      <Card className="p-6 shadow-card bg-card">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-col w-full gap-3 h-auto p-4 bg-muted/50 rounded-lg">
            <TabsTrigger 
              value="daily-collections" 
              className="flex items-center justify-start gap-4 py-4 px-6 w-full text-left min-h-[60px] rounded-md border-2 border-transparent transition-all duration-200 hover:bg-muted/80 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md"
            >
              <FileText className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-semibold">
                {t("రోజువారీ వసూలు", "Daily Collections")}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="loan-database" 
              className="flex items-center justify-start gap-4 py-4 px-6 w-full text-left min-h-[60px] rounded-md border-2 border-transparent transition-all duration-200 hover:bg-muted/80 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md"
            >
              <Database className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-semibold">
                {t("లోన్ డేటాబేస్", "Loan Database")}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="customer-wise" 
              className="flex items-center justify-start gap-4 py-4 px-6 w-full text-left min-h-[60px] rounded-md border-2 border-transparent transition-all duration-200 hover:bg-muted/80 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md"
            >
              <Users className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-semibold">
                {t("కస్టమర్ వైస్ రిపోర్ట్", "Customer Wise Report")}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Daily Collections Tab */}
          <TabsContent value="daily-collections" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <Label htmlFor="selectedDate" className="text-foreground">{t("తేదీ ఎంచుకోండి", "Select Date")}</Label>
                  <Input
                    type="date"
                    id="selectedDate"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={fetchDailyCollections} 
                  disabled={loading || !selectedDate}
                  className="mt-6"
                >
                  {loading ? t("లోడ్ అవుతోంది...", "Loading...") : t("రిపోర్ట్ చూడండి", "View Report")}
                </Button>
              </div>
              {dailyCollections.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={downloadDailyCollectionsPDF}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {t("PDF డౌన్‌లోడ్", "Download PDF")}
                </Button>
              )}
            </div>

            {/* Daily Summary */}
            {dailyCollections.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 shadow-card bg-gradient-success">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <IndianRupee className="h-5 w-5 text-white" />
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-white/90 font-semibold">{t("రోజువారీ వసూలు", "Daily Collections")}</p>
                      <p className="text-lg font-bold text-white">
                        ₹{dailyTotal.toLocaleString()}
                      </p>
                      <p className="text-xs text-white/80 font-medium">
                        {dailyCollections.length} {t("వసూలు", "collections")}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Daily Collections Table */}
            {dailyCollections.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("కస్టమర్ ID", "Customer ID")}</TableHead>
                      <TableHead>{t("కస్టమర్ పేరు", "Customer Name")}</TableHead>
                      <TableHead>{t("మొబైల్", "Mobile")}</TableHead>
                      <TableHead>{t("వసూలు", "Collected")}</TableHead>
                      <TableHead>{t("బకాయి", "Outstanding")}</TableHead>
                      <TableHead>{t("గమనికలు", "Notes")}</TableHead>
                      <TableHead>{t("సమయం", "Time")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyCollections.map((collection) => (
                      <TableRow key={collection.id}>
                        <TableCell className="font-mono text-sm">{collection.loans?.id?.substring(0, 8) || 'N/A'}</TableCell>
                        <TableCell className="font-medium">{collection.loans?.customer_name || 'N/A'}</TableCell>
                        <TableCell>{collection.loans?.customer_mobile || 'N/A'}</TableCell>
                        <TableCell>₹{Number(collection.amount).toLocaleString()}</TableCell>
                        <TableCell>₹{Number(collection.outstanding_amount || 0).toLocaleString()}</TableCell>
                        <TableCell>{collection.notes || '-'}</TableCell>
                        <TableCell>{new Date(collection.created_at).toLocaleTimeString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : selectedDate && !loading ? (
              <Card className="p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t("ఈ తేదీకి వసూలు లేవు", "No collections found for this date")}</p>
              </Card>
            ) : null}
          </TabsContent>

          {/* Loan Database Tab */}
          <TabsContent value="loan-database" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{t("పూర్తి లోన్ డేటాబేస్", "Complete Loan Database")}</h3>
                <p className="text-sm text-muted-foreground">{t("మీ అన్ని లోన్ల వివరాలు", "All your loan details")}</p>
              </div>
              {allLoans.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={downloadLoanDatabasePDF}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {t("PDF డౌన్‌లోడ్", "Download PDF")}
                </Button>
              )}
            </div>

            {/* Loan Database Summary */}
            {allLoans.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 shadow-card bg-gradient-success">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Users className="h-5 w-5 text-white" />
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-white/90 font-semibold">{t("మొత్తం లోన్లు", "Total Loans")}</p>
                      <p className="text-lg font-bold text-white">{allLoans.length}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 shadow-card bg-gradient-success">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <IndianRupee className="h-5 w-5 text-white" />
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-white/90 font-semibold">{t("మొత్తం మొత్తం", "Total Amount")}</p>
                      <p className="text-lg font-bold text-white">
                        ₹{allLoans.reduce((sum, loan) => sum + Number(loan.amount), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 shadow-card bg-gradient-success">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Calendar className="h-5 w-5 text-white" />
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-white/90 font-semibold">{t("క్రియాశీల లోన్లు", "Active Loans")}</p>
                      <p className="text-lg font-bold text-white">
                        {allLoans.filter(loan => loan.status === 'active').length}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Loan Database Table */}
            {allLoans.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("లోన్ ID", "Loan ID")}</TableHead>
                      <TableHead>{t("కస్టమర్ పేరు", "Customer Name")}</TableHead>
                      <TableHead>{t("మొబైల్", "Mobile")}</TableHead>
                      <TableHead>{t("మొత్తం", "Amount")}</TableHead>
                      <TableHead>{t("వడ్డీ రేటు", "Interest Rate")}</TableHead>
                      <TableHead>{t("వ్యవధి", "Duration")}</TableHead>
                      <TableHead>{t("స్థితి", "Status")}</TableHead>
                      <TableHead>{t("ప్రారంభ తేదీ", "Start Date")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-mono text-sm">{loan.id?.substring(0, 8) || 'N/A'}</TableCell>
                        <TableCell className="font-medium">{loan.customer_name}</TableCell>
                        <TableCell>{loan.customer_mobile || 'N/A'}</TableCell>
                        <TableCell>₹{Number(loan.amount).toLocaleString()}</TableCell>
                        <TableCell>{loan.interest_rate || 0}%</TableCell>
                        <TableCell>{loan.duration_months || 0} months</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            loan.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {loan.status || 'active'}
                          </span>
                        </TableCell>
                        <TableCell>{loan.start_date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : !loading ? (
              <Card className="p-8 text-center">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t("లోన్లు లేవు", "No loans found")}</p>
              </Card>
            ) : null}
          </TabsContent>

          {/* Customer Wise Report Tab */}
          <TabsContent value="customer-wise" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{t("కస్టమర్ వైస్ రిపోర్ట్", "Customer Wise Report")}</h3>
                <p className="text-sm text-muted-foreground">{t("ప్రతి కస్టమర్ కు సంబంధించిన వివరాలు", "Details for each customer")}</p>
              </div>
              {customerWiseData.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={downloadCustomerWisePDF}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {t("PDF డౌన్‌లోడ్", "Download PDF")}
                </Button>
              )}
            </div>

            {/* Customer Wise Data Table */}
            {customerWiseData.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("లోన్ ID", "Loan ID")}</TableHead>
                      <TableHead>{t("కస్టమర్ పేరు", "Customer Name")}</TableHead>
                      <TableHead>{t("ప్రధాన మొత్తం", "Principal Amount")}</TableHead>
                      <TableHead>{t("బకాయి మొత్తం", "Outstanding Amount")}</TableHead>
                      <TableHead>{t("రోజువారీ చెల్లింపులు", "Day Wise Payments")}</TableHead>
                      <TableHead>{t("లోన్ కాలవధి", "Loan Timeframe")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerWiseData.map((customer) => (
                      <TableRow key={customer.loan_id}>
                        <TableCell className="font-mono text-sm">{customer.loan_id.substring(0, 8)}</TableCell>
                        <TableCell className="font-medium">{customer.customer_name}</TableCell>
                        <TableCell>₹{customer.principal_amount.toLocaleString()}</TableCell>
                        <TableCell>₹{customer.outstanding_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {customer.collections.length > 0 ? (
                              <div className="text-xs space-y-1">
                                {customer.collections.slice(0, 3).map((collection: any, index: number) => (
                                  <div key={index} className="flex justify-between">
                                    <span>{new Date(collection.collection_date).toLocaleDateString()}</span>
                                    <span>₹{Number(collection.amount).toLocaleString()}</span>
                                  </div>
                                ))}
                                {customer.collections.length > 3 && (
                                  <div className="text-muted-foreground">
                                    +{customer.collections.length - 3} more...
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">{t("చెల్లింపులు లేవు", "No payments")}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{customer.start_date} to {customer.end_date}</div>
                            <div className="text-muted-foreground">{customer.duration_months} months</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : !loading ? (
              <Card className="p-8 text-center">
                <FileBarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t("కస్టమర్ డేటా లేదు", "No customer data available")}</p>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}