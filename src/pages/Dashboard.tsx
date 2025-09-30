import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Search, FileText, MessageSquare, CreditCard, Pill, Users, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { profile } = useAuth();
  const firstName = profile?.first_name || 'Guest';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {firstName}!</h1>
            <p className="text-muted-foreground">Manage your healthcare appointments and records</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Find Specialists
                </CardTitle>
                <CardDescription>Search for healthcare providers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/search">
                  <Button className="w-full">Search Specialists</Button>
                </Link>
                <Link to="/search/clinics">
                  <Button variant="outline" className="w-full">Search Clinics</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  My Appointments
                </CardTitle>
                <CardDescription>View upcoming appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/appointments">
                  <Button variant="outline" className="w-full">View All</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Prescriptions
                </CardTitle>
                <CardDescription>View your prescriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/prescriptions">
                  <Button variant="outline" className="w-full">View All</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payments
                </CardTitle>
                <CardDescription>View payment history</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/payments">
                  <Button variant="outline" className="w-full">View History</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Family Members
                </CardTitle>
                <CardDescription>Manage family members</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/family-members">
                  <Button variant="outline" className="w-full">Manage</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>View your notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/notifications">
                  <Button variant="outline" className="w-full">View All</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Medical Records
                </CardTitle>
                <CardDescription>Access your health records</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/medical-records">
                  <Button variant="outline" className="w-full">View Records</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages
                </CardTitle>
                <CardDescription>Chat with your providers</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/messages">
                  <Button variant="outline" className="w-full">Open Messages</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>You have no upcoming appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Start by finding a healthcare specialist</p>
                <Link to="/search">
                  <Button>Find a Specialist</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
