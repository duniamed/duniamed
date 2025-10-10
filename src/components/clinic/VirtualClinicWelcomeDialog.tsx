import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Upload, Video, Calendar, Users } from 'lucide-react';

export function VirtualClinicWelcomeDialog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const clinicId = searchParams.get('new_clinic');

  useEffect(() => {
    if (clinicId) {
      setOpen(true);
    }
  }, [clinicId]);

  const handleClose = () => {
    setOpen(false);
    // Remove the new_clinic parameter from URL
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('new_clinic');
    setSearchParams(newParams);
  };

  const handleSetupMedia = () => {
    navigate(`/clinic/profile/media-edit?id=${clinicId}`);
    handleClose();
  };

  const handleSetupProfile = () => {
    navigate(`/clinic/profile/edit?id=${clinicId}`);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Virtual Clinic Created!</DialogTitle>
              <DialogDescription>
                Your virtual clinic has been successfully created
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Complete these steps to make your clinic stand out:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <Upload className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">Add Media</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload your logo, clinic photos, and an introduction video
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleSetupMedia}>
                Setup
              </Button>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">Complete Profile</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Add specialties, services, and contact information
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleSetupProfile}>
                Edit
              </Button>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">Set Availability</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure your availability schedule for appointments
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => {
                navigate('/specialist/availability');
                handleClose();
              }}>
                Setup
              </Button>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <Video className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">Test Video Setup</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Ensure your video conferencing is working properly
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => {
                navigate('/clinical-focus');
                handleClose();
              }}>
                Test
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full">
            Got it, thanks!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}