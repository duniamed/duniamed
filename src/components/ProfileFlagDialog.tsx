import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Flag } from 'lucide-react';

/**
 * C11 FRESHNESS - Profile Flag Dialog
 * Allows patients to crowd-flag outdated or incorrect specialist information
 */

interface ProfileFlagDialogProps {
  specialistId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileFlagDialog({ specialistId, open, onOpenChange }: ProfileFlagDialogProps) {
  const [flagType, setFlagType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!flagType || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a flag type and provide a description",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('profile_flags').insert({
        specialist_id: specialistId,
        flagged_by: user.id,
        flag_type: flagType,
        description: description.trim()
      });

      if (error) throw error;

      toast({
        title: "Flag submitted",
        description: "Thank you for helping keep information accurate. We'll review this shortly."
      });

      setFlagType('');
      setDescription('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error submitting flag",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Flag Profile Issue
          </DialogTitle>
          <DialogDescription>
            Help us keep specialist information accurate and up-to-date
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Issue Type</label>
            <Select value={flagType} onValueChange={setFlagType}>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outdated_info">Outdated Information</SelectItem>
                <SelectItem value="incorrect_credential">Incorrect Credentials</SelectItem>
                <SelectItem value="wrong_specialty">Wrong Specialty Listed</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Flag'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}