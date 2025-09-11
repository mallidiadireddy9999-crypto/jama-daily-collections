import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, TrendingUp, Activity, UserCheck, UserX, ArrowLeft, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SuperAdminDashboardProps {
  onNavigate: (view: string) => void;
  onBack?: () => void;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  totalCustomers: number;
  totalLoans: number;
  totalOutstanding: number;
  totalCollections: number;
}

export const SuperAdminDashboard = ({ onNavigate, onBack }: SuperAdminDashboardProps) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    totalCustomers: 0,
    totalLoans: 0,
    totalOutstanding: 0,
    totalCollections: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all users
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'super_admin');

      if (usersError) throw usersError;

      // Fetch all loans
      const { data: allLoans, error: loansError } = await supabase
        .from('loans')
        .select('*');

      if (loansError) throw loansError;

      // Fetch all collections
      const { data: allCollections, error: collectionsError } = await supabase
        .from('collections')
        .select('*');

      if (collectionsError) throw collectionsError;

      // Calculate stats
      const totalUsers = allUsers?.length || 0;
      const activeUsers = allUsers?.filter(user => user.is_active)?.length || 0;
      const inactiveUsers = totalUsers - activeUsers;
      
      const monthlyRevenue = activeUsers * 1000; // ₹1000 per user per month
      const yearlyRevenue = monthlyRevenue * 12;
      
      const totalLoans = allLoans?.length || 0;
      const totalLoanAmount = allLoans?.reduce((sum, loan) => sum + Number(loan.amount), 0) || 0;
      const totalCollectionsAmount = allCollections?.reduce((sum, collection) => sum + Number(collection.amount), 0) || 0;
      const totalOutstanding = totalLoanAmount - totalCollectionsAmount;

      // Count unique customers
      const uniqueCustomers = new Set(allLoans?.map(loan => loan.customer_name)).size;

      setStats({
        totalUsers,
        activeUsers,
        inactiveUsers,
        monthlyRevenue,
        yearlyRevenue,
        totalCustomers: uniqueCustomers,
        totalLoans,
        totalOutstanding,
        totalCollections: totalCollectionsAmount,
      });

      setUsers(allUsers || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="default" onClick={onBack} className="p-2 shadow-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        </div>
        <Badge variant="secondary">Company Level Access</Badge>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue (MRR)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active users × ₹1000
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yearly Revenue (YRR)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.yearlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Projected annual revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jama Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active, {stats.inactiveUsers} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Business Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalLoans}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{stats.totalCollections.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage Jama users and their access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{user.full_name || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">{user.mobile_number || 'No mobile'}</div>
                  <div className="text-xs text-muted-foreground">
                    Subscription: {user.subscription_status} | 
                    Started: {user.subscription_start_date ? new Date(user.subscription_start_date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.is_active ? "default" : "destructive"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleUserStatus(user.user_id, user.is_active)}
                  >
                    {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          onClick={() => onNavigate('user-reports')}
          className="h-20 text-lg"
        >
          View Detailed Reports
        </Button>
        <Button 
          onClick={() => onNavigate('ads-management')}
          variant="outline"
          className="h-20 text-lg"
        >
          <Megaphone className="h-6 w-6 mr-2" />
          Ads Management
        </Button>
        <Button 
          onClick={() => onNavigate('notifications')}
          variant="outline"
          className="h-20 text-lg"
        >
          Send Notifications
        </Button>
      </div>
    </div>
  );
};