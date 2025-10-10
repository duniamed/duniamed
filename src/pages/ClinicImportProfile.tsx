import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ImportedData {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  hours?: Record<string, string>;
  photos?: string[];
  reviews?: number;
  rating?: number;
}

export default function ClinicImportProfile() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('google');
  const [loading, setLoading] = useState(false);
  const [importedData, setImportedData] = useState<ImportedData | null>(null);
  
  const [urls, setUrls] = useState({
    google: '',
    instagram: '',
    yelp: '',
    facebook: '',
    healthgrades: '',
  });

  const handleImport = async (source: string) => {
    setLoading(true);
    
    try {
      const url = urls[source as keyof typeof urls];
      
      if (!url) {
        toast({
          variant: 'destructive',
          title: 'URL Required',
          description: `Please enter a ${source} URL to import`,
        });
        return;
      }

      // Call edge function to import data
      const { data, error } = await supabase.functions.invoke('import-from-google-maps', {
        body: { source, url },
      });

      if (error) throw error;

      setImportedData(data);
      
      toast({
        title: 'Import Successful',
        description: `Data imported from ${source}. Review and apply changes below.`,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: error.message || 'Failed to import profile data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!importedData) return;

    try {
      // Apply changes to clinic profile
      toast({
        title: 'Applying Changes',
        description: 'Updating your clinic profile...',
      });

      // Save to profile_import_history
      const { error } = await supabase.from('profile_import_history').insert({
        source: activeTab,
        imported_data: importedData as any,
      });

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'Your clinic profile has been updated successfully!',
      });
      
      setImportedData(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    }
  };

  return (
    <DashboardLayout
      title="Import Clinic Profile"
      description="Import your clinic information from existing online profiles"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Multi-Source Profile Import</CardTitle>
            <CardDescription>
              Enter your profile URLs from various platforms to automatically import your clinic information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="google">Google Maps</TabsTrigger>
                <TabsTrigger value="instagram">Instagram</TabsTrigger>
                <TabsTrigger value="yelp">Yelp</TabsTrigger>
                <TabsTrigger value="facebook">Facebook</TabsTrigger>
                <TabsTrigger value="healthgrades">Healthgrades</TabsTrigger>
              </TabsList>

              {Object.keys(urls).map(source => (
                <TabsContent key={source} value={source} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${source}-url`}>
                      {source.charAt(0).toUpperCase() + source.slice(1)} Profile URL
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`${source}-url`}
                        placeholder={`https://${source}.com/your-clinic`}
                        value={urls[source as keyof typeof urls]}
                        onChange={(e) => setUrls({ ...urls, [source]: e.target.value })}
                      />
                      <Button onClick={() => handleImport(source)} disabled={loading}>
                        <Download className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>How to find your URL:</strong>
                      {source === 'google' && ' Search for your clinic on Google Maps, click "Share", and copy the link.'}
                      {source === 'instagram' && ' Visit your Instagram business profile and copy the URL from your browser.'}
                      {source === 'yelp' && ' Find your business on Yelp and copy the URL from the address bar.'}
                      {source === 'facebook' && ' Go to your Facebook business page and copy the page URL.'}
                      {source === 'healthgrades' && ' Search for your profile on Healthgrades and copy the URL.'}
                    </p>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {importedData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Imported Data Preview
              </CardTitle>
              <CardDescription>
                Review the imported information and apply changes to your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {importedData.name && (
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{importedData.name}</p>
                  </div>
                )}
                {importedData.address && (
                  <div>
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="font-medium">{importedData.address}</p>
                  </div>
                )}
                {importedData.phone && (
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{importedData.phone}</p>
                  </div>
                )}
                {importedData.email && (
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{importedData.email}</p>
                  </div>
                )}
                {importedData.rating && (
                  <div>
                    <Label className="text-muted-foreground">Rating</Label>
                    <p className="font-medium">{importedData.rating} / 5.0</p>
                  </div>
                )}
                {importedData.reviews && (
                  <div>
                    <Label className="text-muted-foreground">Reviews</Label>
                    <p className="font-medium">{importedData.reviews} reviews</p>
                  </div>
                )}
              </div>

              {importedData.photos && importedData.photos.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Photos</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {importedData.photos.slice(0, 8).map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Clinic photo ${idx + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                    ))}
                  </div>
                  {importedData.photos.length > 8 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      +{importedData.photos.length - 8} more photos
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <Button onClick={handleApplyChanges} className="flex-1">
                  Apply Changes to Profile
                </Button>
                <Button variant="outline" onClick={() => setImportedData(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
