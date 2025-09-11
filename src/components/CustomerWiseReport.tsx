import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CustomerLoanData {
  loan_id: string;
  customer_name: string;
  customer_mobile: string;
  principle_amount: number;
  outstanding_amount: number;
  total_collections: number;
  daily_payments: number;
  start_date: string;
  duration_months: number;
  duration_unit: string;
  status: string;
}

interface CustomerWiseReportProps {
  onBack: () => void;
}

export default function CustomerWiseReport({ onBack }: CustomerWiseReportProps) {
  const [customerData, setCustomerData] = useState<CustomerLoanData[]>([]);
  const [filteredData, setFilteredData] = useState<CustomerLoanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchCustomerWiseData();
  }, []);

  useEffect(() => {
    // Filter data based on search term
    const filtered = customerData.filter(
      (item) =>
        item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer_mobile?.includes(searchTerm) ||
        item.loan_id.includes(searchTerm)
    );
    setFilteredData(filtered);
  }, [searchTerm, customerData]);

  const fetchCustomerWiseData = async () => {
    try {
      setLoading(true);

      // Fetch loans with collections data
      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select(`
          id,
          customer_name,
          customer_mobile,
          amount,
          disbursed_amount,
          start_date,
          duration_months,
          duration_unit,
          status,
          collections (
            amount,
            collection_date
          )
        `);

      if (loansError) throw loansError;

      const processedData: CustomerLoanData[] = loansData.map((loan) => {
        const totalCollections = loan.collections?.reduce(
          (sum: number, collection: any) => sum + Number(collection.amount),
          0
        ) || 0;

        const outstandingAmount = Number(loan.amount) - totalCollections;
        
        // Calculate average daily payment based on collections
        const collectionsCount = loan.collections?.length || 0;
        const dailyPayments = collectionsCount > 0 ? totalCollections / collectionsCount : 0;

        return {
          loan_id: loan.id,
          customer_name: loan.customer_name,
          customer_mobile: loan.customer_mobile || "",
          principle_amount: Number(loan.amount),
          outstanding_amount: Math.max(0, outstandingAmount),
          total_collections: totalCollections,
          daily_payments: Math.round(dailyPayments),
          start_date: loan.start_date,
          duration_months: loan.duration_months || 0,
          duration_unit: loan.duration_unit || "days",
          status: loan.status,
        };
      });

      setCustomerData(processedData);
      setFilteredData(processedData);
    } catch (error) {
      console.error("Error fetching customer data:", error);
      toast({
        title: t("లోపం", "Error"),
        description: t("కస్టమర్ డేటా పొందడంలో లోపం", "Error fetching customer data"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const calculateTimeFrame = (startDate: string, duration: number, unit: string) => {
    const start = new Date(startDate);
    const end = new Date(start);
    
    if (unit === "days") {
      end.setDate(start.getDate() + duration);
    } else {
      end.setMonth(start.getMonth() + duration);
    }
    
    return `${formatDate(startDate)} - ${formatDate(end.toISOString())}`;
  };

  const exportToCSV = () => {
    const headers = [
      "Loan ID",
      "Customer Name",
      "Mobile",
      "Principle Amount",
      "Outstanding Amount",
      "Total Collections",
      "Avg Daily Payment",
      "Time Frame",
      "Status"
    ];

    const csvData = filteredData.map(item => [
      item.loan_id,
      item.customer_name,
      item.customer_mobile,
      item.principle_amount,
      item.outstanding_amount,
      item.total_collections,
      item.daily_payments,
      calculateTimeFrame(item.start_date, item.duration_months, item.duration_unit),
      item.status
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "customer_wise_report.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="default" onClick={onBack} className="p-2 shadow-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">
            {t("కస్టమర్ వారీ రిపోర్ట్", "Customer Wise Report")}
          </h1>
        </div>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          {t("ఎక్స్‌పోర్ట్", "Export")}
        </Button>
      </div>

      {/* Search and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("కస్టమర్ పేరు, మొబైల్ లేదా లోన్ ID తో వెతకండి", "Search by customer name, mobile or loan ID")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t("మొత్తం కస్టమర్లు", "Total Customers")}
              </p>
              <p className="text-2xl font-bold text-primary">{filteredData.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("కస్టమర్ లోన్ వివరాలు", "Customer Loan Details")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("లోన్ ID", "Loan ID")}</TableHead>
                  <TableHead>{t("కస్టమర్ పేరు", "Customer Name")}</TableHead>
                  <TableHead>{t("మొబైల్", "Mobile")}</TableHead>
                  <TableHead>{t("ప్రిన్సిపల్ మొత్తం", "Principle Amount")}</TableHead>
                  <TableHead>{t("బకాయి మొత్తం", "Outstanding Amount")}</TableHead>
                  <TableHead>{t("రోజువారీ చెల్లింపు", "Avg Daily Payment")}</TableHead>
                  <TableHead>{t("సమయ వ్యవధి", "Time Frame")}</TableHead>
                  <TableHead>{t("స్థితి", "Status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.loan_id}>
                    <TableCell className="font-mono text-sm">
                      {item.loan_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium">{item.customer_name}</TableCell>
                    <TableCell>{item.customer_mobile}</TableCell>
                    <TableCell>{formatCurrency(item.principle_amount)}</TableCell>
                    <TableCell className={item.outstanding_amount > 0 ? "text-red-600" : "text-green-600"}>
                      {formatCurrency(item.outstanding_amount)}
                    </TableCell>
                    <TableCell>{formatCurrency(item.daily_payments)}</TableCell>
                    <TableCell className="text-sm">
                      {calculateTimeFrame(item.start_date, item.duration_months, item.duration_unit)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : item.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {t("డేటా కనిపించలేదు", "No data found")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}