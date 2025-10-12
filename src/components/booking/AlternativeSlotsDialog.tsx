import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";

interface AlternativeSlot {
  time: string;
  specialist_id: string;
  specialist_name: string;
  rating: number;
  avatar_url: string;
  reason: string;
  time_diff_minutes: number;
}

interface AlternativeSlotsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alternatives: AlternativeSlot[];
  onSelectSlot: (slot: AlternativeSlot) => void;
}

export function AlternativeSlotsDialog({ 
  open, 
  onOpenChange, 
  alternatives,
  onSelectSlot 
}: AlternativeSlotsDialogProps) {
  const formatTimeDiff = (minutes: number) => {
    if (minutes === 0) return "Exact time";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${minutes > 0 ? "later" : "earlier"}`;
    }
    return `${mins}m ${minutes > 0 ? "later" : "earlier"}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alternative Available Slots</DialogTitle>
          <DialogDescription>
            This slot is no longer available. Here are some alternative options:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {alternatives.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No alternative slots available at this time. Please try a different date or specialist.
              </p>
            </div>
          ) : (
            alternatives.map((slot, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={slot.avatar_url} alt={slot.specialist_name} />
                      <AvatarFallback>{slot.specialist_name[0]}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div>
                        <h4 className="font-semibold">{slot.specialist_name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{slot.rating.toFixed(1)}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {slot.reason}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(slot.time), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(slot.time), "h:mm a")}</span>
                        </div>
                        {slot.time_diff_minutes > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {formatTimeDiff(slot.time_diff_minutes)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button onClick={() => onSelectSlot(slot)}>
                    Book This Slot
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}