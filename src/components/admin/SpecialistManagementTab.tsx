import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Specialist {
  id: string;
  user_id: string;
  license_number: string;
  verification_status: string;
  specialty: string[];
  rating: number;
  is_accepting_patients: boolean;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
  average_rating: number;
  total_reviews: number;
}

export function SpecialistManagementTab() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const { toast } = useToast();

  const fetchSpecialists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-list-specialists', {
        body: { page, limit: 20, search, verification_status: verificationFilter },
      });

      if (error) throw error;

      setSpecialists(data.specialists || []);
      setTotalPages(data.pagination.total_pages);
    } catch (error: any) {
      toast({
        title: "Error loading specialists",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialists();
  }, [page, verificationFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchSpecialists();
  };

  const handleUpdateSpecialist = async (specialistId: string, updates: any) => {
    try {
      const { error } = await supabase.functions.invoke('admin-update-specialist', {
        body: { specialist_id: specialistId, updates },
      });

      if (error) throw error;

      toast({
        title: "Specialist updated",
        description: "Specialist has been updated successfully",
      });

      fetchSpecialists();
      setSelectedSpecialist(null);
    } catch (error: any) {
      toast({
        title: "Error updating specialist",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getVerificationBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      verified: "default",
      pending: "secondary",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search specialists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
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
                <TableHead>License</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specialists.map((specialist) => (
                <TableRow key={specialist.id}>
                  <TableCell>
                    {specialist.profiles.first_name} {specialist.profiles.last_name}
                  </TableCell>
                  <TableCell>{specialist.license_number}</TableCell>
                  <TableCell>{specialist.specialty.join(", ")}</TableCell>
                  <TableCell>{getVerificationBadge(specialist.verification_status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {specialist.average_rating?.toFixed(1) || "N/A"}
                      <span className="text-muted-foreground text-sm">
                        ({specialist.total_reviews})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSpecialist(specialist)}
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

      <Dialog open={!!selectedSpecialist} onOpenChange={() => setSelectedSpecialist(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Specialist Details</DialogTitle>
          </DialogHeader>
          {selectedSpecialist && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSpecialist.profiles.first_name} {selectedSpecialist.profiles.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{selectedSpecialist.profiles.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">License Number</p>
                  <p className="text-sm text-muted-foreground">{selectedSpecialist.license_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Verification Status</p>
                  {getVerificationBadge(selectedSpecialist.verification_status)}
                </div>
                <div>
                  <p className="text-sm font-medium">Specialty</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSpecialist.specialty.join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">
                      {selectedSpecialist.average_rating?.toFixed(1) || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    handleUpdateSpecialist(selectedSpecialist.id, {
                      verification_status: "verified",
                    })
                  }
                  disabled={selectedSpecialist.verification_status === "verified"}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    handleUpdateSpecialist(selectedSpecialist.id, {
                      verification_status: "rejected",
                    })
                  }
                  disabled={selectedSpecialist.verification_status === "rejected"}
                >
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleUpdateSpecialist(selectedSpecialist.id, {
                      is_accepting_patients: !selectedSpecialist.is_accepting_patients,
                    })
                  }
                >
                  {selectedSpecialist.is_accepting_patients ? "Disable" : "Enable"} Bookings
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}