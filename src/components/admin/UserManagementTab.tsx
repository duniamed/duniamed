import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  user_roles: { role: string }[];
}

export function UserManagementTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-list-users', {
        body: { page, limit: 20, search, role: roleFilter },
      });

      if (error) throw error;

      setUsers(data.users || []);
      setTotalPages(data.pagination.total_pages);
    } catch (error: any) {
      toast({
        title: "Error loading users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const { error } = await supabase.functions.invoke('admin-update-user', {
        body: { user_id: userId, updates },
      });

      if (error) throw error;

      toast({
        title: "User updated",
        description: "User has been updated successfully",
      });

      fetchUsers();
      setSelectedUser(null);
    } catch (error: any) {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All roles</SelectItem>
            <SelectItem value="patient">Patient</SelectItem>
            <SelectItem value="specialist">Specialist</SelectItem>
            <SelectItem value="clinic_admin">Clinic Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                    {user.user_roles?.map((r) => (
                      <Badge key={r.role} className="ml-2">{r.role}</Badge>
                    ))}
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.first_name} {selectedUser.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Role</p>
                <Badge>{selectedUser.role}</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleUpdateUser(selectedUser.id, { role: 'patient' })}
                >
                  Set as Patient
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateUser(selectedUser.id, { role: 'specialist' })}
                >
                  Set as Specialist
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}