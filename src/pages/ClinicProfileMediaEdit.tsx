import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';

export default function ClinicProfileMediaEdit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const clinicId = searchParams.get('id');

  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    if (clinicId) {
      loadClinic();
      loadPhotos();
    }
  }, [clinicId]);

  const loadClinic = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();

      if (error) throw error;
      setClinic(data);
      setVideoUrl(data?.intro_video_url || '');
    } catch (error) {
      console.error('Error loading clinic:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clinic data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_photos')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${clinicId}/logo-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('clinic-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('clinic-media')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('clinics')
        .update({ logo_url: publicUrl })
        .eq('id', clinicId);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Logo uploaded successfully',
      });

      loadClinic();
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload logo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const uploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>, category: string) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${clinicId}/photos/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('clinic-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('clinic-media')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('clinic_photos')
        .insert({
          clinic_id: clinicId,
          photo_url: publicUrl,
          category,
          display_order: photos.length,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Photo uploaded successfully',
      });

      loadPhotos();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId: string, photoUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/');
      const filePath = urlParts.slice(-3).join('/');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('clinic-media')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('clinic_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Photo deleted successfully',
      });

      loadPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
    }
  };

  const saveVideoUrl = async () => {
    try {
      const { error } = await supabase
        .from('clinics')
        .update({ intro_video_url: videoUrl })
        .eq('id', clinicId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Video URL saved successfully',
      });

      loadClinic();
    } catch (error) {
      console.error('Error saving video URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to save video URL',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Edit Clinic Media" description="Loading...">
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2">Loading clinic data...</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Edit Clinic Media"
      description="Manage your clinic's photos, videos, and media assets"
    >
      <div className="space-y-6 max-w-5xl">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Clinic Logo</CardTitle>
            <CardDescription>Upload your clinic's logo (recommended: 400x400px)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clinic?.logo_url && (
                <div className="flex items-center gap-4">
                  <img src={clinic.logo_url} alt="Clinic logo" className="h-24 w-24 object-contain rounded-lg border p-2 bg-white" />
                  <div className="text-sm text-muted-foreground">
                    <p>Current logo</p>
                    <p className="text-xs mt-1">Upload a new image to replace</p>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors w-fit">
                    <Upload className="h-4 w-4" />
                    <span>{uploading ? 'Uploading...' : 'Upload Logo'}</span>
                  </div>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadLogo}
                  disabled={uploading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Gallery */}
        <Card>
          <CardHeader>
            <CardTitle>Photo Gallery</CardTitle>
            <CardDescription>Upload photos of your clinic facilities (exterior, waiting room, exam rooms, team)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.photo_url}
                        alt={photo.category}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => deletePhoto(photo.id, photo.photo_url)}
                        className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-1 rounded capitalize">
                        {photo.category.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {['exterior', 'waiting_room', 'exam_rooms', 'team'].map((category) => (
                  <div key={category}>
                    <Label htmlFor={`photo-${category}`} className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors">
                        <ImageIcon className="h-4 w-4" />
                        <span className="capitalize">Add {category.replace('_', ' ')}</span>
                      </div>
                    </Label>
                    <Input
                      id={`photo-${category}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => uploadPhoto(e, category)}
                      disabled={uploading}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Tour */}
        <Card>
          <CardHeader>
            <CardTitle>Video Tour</CardTitle>
            <CardDescription>Add a video introduction or virtual tour (YouTube or Vimeo embed URL)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clinic?.intro_video_url && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <iframe
                    src={clinic.intro_video_url.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                    title="Clinic video tour"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <Button onClick={saveVideoUrl} variant="outline" disabled={!videoUrl || videoUrl === clinic?.intro_video_url}>
                  <Video className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Use YouTube or Vimeo embed URLs for best compatibility
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button onClick={() => navigate(`/clinic/profile/edit?id=${clinicId}`)}>
            Edit Clinic Info
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
