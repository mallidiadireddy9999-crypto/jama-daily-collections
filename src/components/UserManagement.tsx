import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Eye, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface UserManagementProps {
  onBack: () => void;
}

export const UserManagement = ({ onBack }: UserManagementProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userLoans, setUserLoans] = useState<any[]>([]);
  const [userCollections, setUserCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'super_admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user's loans
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (loansError) throw loansError;

      // Fetch user's collections
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('*, loans(customer_name, customer_mobile)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (collectionsError) throw collectionsError;

      setUserLoans(loans || []);
      setUserCollections(collections || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    }
  };

  const viewUserDetails = async (user: any) => {
    setSelectedUser(user);
    await fetchUserData(user.user_id);
  };

  const exportUserData = (user: any) => {
    const doc = new jsPDF();
    
    // Add Jama logo (if available)
    try {
      doc.addImage('/src/assets/jama-logo.png', 'PNG', 20, 10, 30, 15);
    } catch (error) {
      console.log('Logo not found, continuing without it');
    }
    
    // Header
    doc.setFontSize(18);
    doc.text('JAMA - User Data Report', 20, 35);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`User: ${user.full_name || 'N/A'}`, 20, 52);
    doc.text(`Mobile: ${user.mobile_number || 'N/A'}`, 20, 59);
    doc.text(`Status: ${user.is_active ? 'Active' : 'Inactive'}`, 20, 66);

    let yPosition = 80;

    // User's Loans
    if (userLoans.length > 0) {
      doc.setFontSize(14);
      doc.text('Loans', 20, yPosition);
      yPosition += 10;

      const loansData = userLoans.map((loan, index) => [
        `L${String(index + 1).padStart(3, '0')}`,
        loan.customer_name || 'N/A',
        loan.customer_mobile || 'N/A',
        `Rs.${Number(loan.amount).toLocaleString()}`,
        `${loan.interest_rate}%`,
        loan.status || 'active',
        new Date(loan.start_date).toLocaleDateString()
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Loan ID', 'Customer', 'Mobile', 'Amount', 'Interest', 'Status', 'Start Date']],
        body: loansData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // User's Collections
    if (userCollections.length > 0) {
      doc.setFontSize(14);
      doc.text('Collections', 20, yPosition);
      yPosition += 10;

      const collectionsData = userCollections.map((collection, index) => [
        `C${String(index + 1).padStart(3, '0')}`,
        collection.loans?.customer_name || 'N/A',
        collection.loans?.customer_mobile || 'N/A',
        `Rs.${Number(collection.amount).toLocaleString()}`,
        new Date(collection.collection_date).toLocaleDateString(),
        collection.notes || 'N/A'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Collection ID', 'Customer', 'Mobile', 'Amount', 'Date', 'Notes']],
        body: collectionsData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] }
      });
    }

    doc.save(`${user.full_name || 'user'}_data_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Success",
      description: "User data exported successfully",
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (selectedUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="default" onClick={() => setSelectedUser(null)} className="shadow-lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <h1 className="text-3xl font-bold">User Details: {selectedUser.full_name}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>User Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {selectedUser.full_name || 'N/A'}</p>
                <p><strong>Mobile:</strong> {selectedUser.mobile_number || 'N/A'}</p>
                <p><strong>Status:</strong> 
                  <Badge variant={selectedUser.is_active ? "default" : "destructive"} className="ml-2">
                    {selectedUser.is_active ? "Active" : "Inactive"}
                  </Badge>
                </p>
                <p><strong>Joined:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loans Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Total Loans:</strong> {userLoans.length}</p>
                <p><strong>Total Amount:</strong> ₹{userLoans.reduce((sum, loan) => sum + Number(loan.amount), 0).toLocaleString()}</p>
                <p><strong>Active Loans:</strong> {userLoans.filter(loan => loan.status === 'active').length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Collections Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Total Collections:</strong> {userCollections.length}</p>
                <p><strong>Total Collected:</strong> ₹{userCollections.reduce((sum, collection) => sum + Number(collection.amount), 0).toLocaleString()}</p>
                <p><strong>This Month:</strong> {userCollections.filter(c => new Date(c.collection_date).getMonth() === new Date().getMonth()).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={() => exportUserData(selectedUser)}>
          <Download className="h-4 w-4 mr-2" />
          Export User Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="default" onClick={onBack} className="shadow-lg">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Jama Users
          </CardTitle>
          <CardDescription>
            Manage all registered Jama users and view their data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{user.full_name || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">{user.mobile_number || 'No mobile'}</div>
                  <div className="text-xs text-muted-foreground">
                    Joined: {new Date(user.created_at).toLocaleDateString()} | 
                    Subscription: {user.subscription_status}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.is_active ? "default" : "destructive"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewUserDetails(user)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportUserData(user)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};