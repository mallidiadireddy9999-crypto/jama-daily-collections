import { useState, useEffect } from "react";
import { ArrowLeft, Download, Calendar, TrendingUp, Users, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [reportType, setReportType] = useState<string>("daily");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set default dates
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setEndDate(todayStr);
    
    if (reportType === 'daily') {
      setStartDate(todayStr);
    } else if (reportType === 'monthly') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
    } else if (reportType === 'annual') {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
    }
  }, [reportType]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: t("లోపం", "Error"),
        description: t("దయచేసి తేదీలను ఎంచుకోండి", "Please select dates"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: t("లోపం", "Error"),
          description: t("దయచేసి లాగిన్ చేయండి", "Please login"),
          variant: "destructive",
        });
        return;
      }

      // Fetch loans data
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.user.id)
        .gte('start_date', startDate)
        .lte('start_date', endDate);

      if (loansError) throw loansError;

      // Fetch collections data
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('*, loans(*)')
        .eq('user_id', user.user.id)
        .gte('collection_date', startDate)
        .lte('collection_date', endDate);

      if (collectionsError) throw collectionsError;

      // Calculate summary
      const totalLoans = loans?.reduce((sum, loan) => sum + Number(loan.amount), 0) || 0;
      const totalCollections = collections?.reduce((sum, collection) => sum + Number(collection.amount), 0) || 0;
      const pendingAmount = totalLoans - totalCollections;

      const summary = {
        totalLoans,
        totalCollections,
        pendingAmount,
        loansCount: loans?.length || 0,
        collectionsCount: collections?.length || 0,
        loans: loans || [],
        collections: collections || [],
      };

      setReportData(summary);

      // Save report to database
      await supabase.from('reports').insert({
        user_id: user.user.id,
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        total_collections: totalCollections,
        total_loans: totalLoans,
        pending_amount: pendingAmount,
        report_data: summary,
      });

      toast({
        title: t("రిపోర్ట్ విజయవంతంగా రూపొందించబడింది", "Report generated successfully"),
        description: t("రిపోర్ట్ డేటా లోడ్ చేయబడింది", "Report data loaded"),
      });

    } catch (error: any) {
      toast({
        title: t("లోపం", "Error"),
        description: error.message || t("రిపోర్ట్ రూపొందించడంలో లోపం", "Error generating report"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    console.log("PDF download initiated, reportData:", reportData);
    
    if (!reportData) {
      toast({
        title: t("లోపం", "Error"),
        description: t("ముందుగా రిపోర్ట్ రూపొందించండి", "Please generate report first"),
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Creating PDF document...");
      const doc = new jsPDF();
      
      // Add title
      console.log("Adding title to PDF...");
      doc.setFontSize(20);
      doc.text('JAMA Report', 105, 20, { align: 'center' });
      
      // Add report details  
      console.log("Adding report details...");
      doc.setFontSize(12);
      doc.text(`Report Type: ${reportType}`, 20, 40);
      doc.text(`Date: ${startDate} to ${endDate}`, 20, 50);
      
      // Add summary
      console.log("Adding summary...");
      doc.setFontSize(14);
      doc.text('Summary:', 20, 70);
      doc.setFontSize(12);
      doc.text(`Total Loans: Rs.${reportData.totalLoans.toLocaleString()}`, 20, 85);
      doc.text(`Total Collections: Rs.${reportData.totalCollections.toLocaleString()}`, 20, 95);
      doc.text(`Pending Amount: Rs.${reportData.pendingAmount.toLocaleString()}`, 20, 105);
      doc.text(`Number of Loans: ${reportData.loansCount}`, 20, 115);
      doc.text(`Number of Collections: ${reportData.collectionsCount}`, 20, 125);

      // Add loans table if data exists
      if (reportData.loans && reportData.loans.length > 0) {
        console.log("Adding loans table...", reportData.loans.length, "loans");
        const loansData = reportData.loans.map((loan: any) => [
          loan.customer_name || 'N/A',
          loan.customer_mobile || 'N/A',
          `Rs.${Number(loan.amount).toLocaleString()}`,
          loan.status || 'active',
          loan.start_date || 'N/A'
        ]);

        autoTable(doc, {
          startY: 140,
          head: [['Customer Name', 'Mobile', 'Amount', 'Status', 'Date']],
          body: loansData,
          theme: 'grid',
        });
        console.log("Loans table added successfully");
      } else {
        console.log("No loans data to add to table");
      }

      // Save the PDF
      console.log("Saving PDF...");
      const filename = `jama-report-${reportType}-${startDate}-${endDate}.pdf`;
      doc.save(filename);
      console.log("PDF saved successfully as:", filename);
      
      toast({
        title: "PDF Download Successful",
        description: `Report PDF file ${filename} has been downloaded`,
      });
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF",
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

      {/* Report Configuration */}
      <Card className="p-6 shadow-card bg-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">{t("రిపోర్ట్ కాన్ఫిగరేషన్", "Report Configuration")}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label htmlFor="reportType" className="text-foreground">{t("రిపోర్ట్ రకం", "Report Type")}</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t("రోజువారీ", "Daily")}</SelectItem>
                <SelectItem value="monthly">{t("నెలవారీ", "Monthly")}</SelectItem>
                <SelectItem value="annual">{t("వార్షిక", "Annual")}</SelectItem>
                <SelectItem value="custom">{t("కస్టమ్", "Custom")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="startDate" className="text-foreground">{t("ప్రారంభ తేదీ", "Start Date")}</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="endDate" className="text-foreground">{t("ముగింపు తేదీ", "End Date")}</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button 
            onClick={generateReport} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            {loading ? t("రూపొందిస్తోంది...", "Generating...") : t("రిపోర్ట్ రూపొందించండి", "Generate Report")}
          </Button>

          {reportData && (
            <Button 
              variant="outline" 
              onClick={downloadPDF}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t("PDF డౌన్‌లోడ్", "Download PDF")}
            </Button>
          )}
        </div>
      </Card>

      {/* Report Summary */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 shadow-card bg-gradient-success">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <IndianRupee className="h-5 w-5 text-white" />
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white/90 font-semibold">{t("మొత్తం వసూలు", "Total Collections")}</p>
                <p className="text-lg font-bold text-white">
                  ₹{reportData.totalCollections.toLocaleString()}
                </p>
                <p className="text-xs text-white/80 font-medium">
                  {reportData.collectionsCount} {t("వసూలు", "collections")}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 shadow-card bg-gradient-success">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-white" />
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white/90 font-semibold">{t("మొత్తం లోన్లు", "Total Loans")}</p>
                <p className="text-lg font-bold text-white">
                  ₹{reportData.totalLoans.toLocaleString()}
                </p>
                <p className="text-xs text-white/80 font-medium">
                  {reportData.loansCount} {t("లోన్లు", "loans")}
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
                <p className="text-xs text-white/90 font-semibold">{t("బాకీ మొత్తం", "Pending Amount")}</p>
                <p className="text-lg font-bold text-white">
                  ₹{reportData.pendingAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}