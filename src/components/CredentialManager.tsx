import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, FileText, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function CredentialManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [backgroundChecks, setBackgroundChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [credentialType, setCredentialType] = useState('');
  const [credentialNumber, setCredentialNumber] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [country, setCountry] = useState('US');
  const [state, setState] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  useEffect(() => {
    if (user) {
      loadCredentials();
      loadBackgroundChecks();
      
      // Real-time subscription for credential status updates
      const channel = supabase
        .channel('credential-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'credential_verifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('Credential status updated:', payload);
          loadCredentials();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('credential_verifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch (error: any) {
      console.error('Load credentials error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load credentials',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBackgroundChecks = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('background_checks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBackgroundChecks(data || []);
    } catch (error: any) {
      console.error('Load background checks error:', error);
    }
  };

  const handleAddCredential = async () => {
    try {
      setUploading(true);

      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!specialist) throw new Error('Specialist profile not found');

      // Call verification edge function
      const { data, error } = await supabase.functions.invoke('verify-credentials', {
        body: {
          specialistId: specialist.id,
          verificationType: credentialType,
          licenseNumber: credentialNumber,
          issuingAuthority,
          country,
          state,
          expirationDate
        }
      });

      if (error) throw error;

      toast({
        title: '✅ Credential Submitted',
        description: 'Verification in progress. You\'ll be notified once complete.'
      });

      loadCredentials();
      
      // Reset form
      setCredentialType('');
      setCredentialNumber('');
      setIssuingAuthority('');
      setState('');
      setExpirationDate('');
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'expired': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'failed': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'default';
      case 'pending': return 'secondary';
      case 'expired': return 'destructive';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const days = Math.floor((new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Credential Manager</h1>
          <p className="text-muted-foreground">
            Automated verification • Real-time monitoring • Compliance tracking
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Credential</DialogTitle>
              <DialogDescription>
                Enter your license or certification details for automatic verification
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Credential Type</label>
                <Select value={credentialType} onValueChange={setCredentialType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medical_license">Medical License</SelectItem>
                    <SelectItem value="board_certification">Board Certification</SelectItem>
                    <SelectItem value="dea_license">DEA License</SelectItem>
                    <SelectItem value="insurance_malpractice">Malpractice Insurance</SelectItem>
                    <SelectItem value="education">Education Credential</SelectItem>
                    <SelectItem value="hospital_privileges">Hospital Privileges</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">License/Credential Number</label>
                <Input
                  placeholder="e.g., CRM 123456"
                  value={credentialNumber}
                  onChange={(e) => setCredentialNumber(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Country</label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="BR">Brazil</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="PT">Portugal</SelectItem>
                      <SelectItem value="ES">Spain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">State/Province</label>
                  <Input
                    placeholder="e.g., SP, CA, NY"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Issuing Authority</label>
                <Input
                  placeholder="e.g., CRM-SP, State Medical Board"
                  value={issuingAuthority}
                  onChange={(e) => setIssuingAuthority(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Expiration Date</label>
                <Input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>

              <Button
                onClick={handleAddCredential}
                disabled={!credentialType || !credentialNumber || !issuingAuthority || uploading}
                className="w-full"
              >
                {uploading ? 'Verifying...' : 'Submit for Verification'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Verification Status Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {credentials.filter(c => c.verification_status === 'verified').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {credentials.filter(c => c.verification_status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {credentials.filter(c => {
                if (!c.expiration_date || c.verification_status !== 'verified') return false;
                const days = getDaysUntilExpiration(c.expiration_date);
                return days <= 90 && days > 0;
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Background Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backgroundChecks.filter(c => c.check_status === 'clear').length}/
              {backgroundChecks.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credentials List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">My Credentials</h2>
        
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              Loading credentials...
            </CardContent>
          </Card>
        ) : credentials.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No credentials added yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first credential to start accepting shifts
              </p>
            </CardContent>
          </Card>
        ) : (
          credentials.map((credential) => {
            const daysUntilExpiration = credential.expiration_date
              ? getDaysUntilExpiration(credential.expiration_date)
              : null;
            const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 90 && daysUntilExpiration > 0;

            return (
              <Card key={credential.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(credential.verification_status)}
                      <div>
                        <CardTitle className="text-base capitalize">
                          {credential.verification_type.replace(/_/g, ' ')}
                        </CardTitle>
                        <CardDescription>
                          {credential.credential_number} • {credential.issuing_authority}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={getStatusColor(credential.verification_status)}>
                        {credential.verification_status}
                      </Badge>
                      {credential.api_verified && (
                        <Badge variant="outline">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Auto-verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Country/State:</span>{' '}
                      <span className="font-medium">{credential.country} {credential.state_province && `/ ${credential.state_province}`}</span>
                    </div>
                    {credential.specialty && (
                      <div>
                        <span className="text-muted-foreground">Specialty:</span>{' '}
                        <span className="font-medium">{credential.specialty}</span>
                      </div>
                    )}
                    {credential.issued_date && (
                      <div>
                        <span className="text-muted-foreground">Issued:</span>{' '}
                        <span className="font-medium">{new Date(credential.issued_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {credential.expiration_date && (
                      <div>
                        <span className="text-muted-foreground">Expires:</span>{' '}
                        <span className={`font-medium ${isExpiringSoon ? 'text-orange-600' : ''}`}>
                          {new Date(credential.expiration_date).toLocaleDateString()}
                          {daysUntilExpiration !== null && daysUntilExpiration > 0 && (
                            <span className="text-xs ml-1">
                              ({daysUntilExpiration} days)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {credential.verified_at && (
                      <div>
                        <span className="text-muted-foreground">Verified:</span>{' '}
                        <span className="font-medium">{new Date(credential.verified_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {credential.verification_method && (
                      <div>
                        <span className="text-muted-foreground">Method:</span>{' '}
                        <span className="font-medium capitalize">{credential.verification_method}</span>
                      </div>
                    )}
                  </div>

                  {credential.verification_notes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">{credential.verification_notes}</p>
                    </div>
                  )}

                  {isExpiringSoon && (
                    <div className="pt-2">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expiring in {daysUntilExpiration} days - Please renew
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Background Checks */}
      {backgroundChecks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Background Checks</h2>
          {backgroundChecks.map((check) => (
            <Card key={check.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base capitalize">
                    {check.check_type.replace(/_/g, ' ')}
                  </CardTitle>
                  <Badge variant={check.check_status === 'clear' ? 'default' : 'destructive'}>
                    {check.check_status}
                  </Badge>
                </div>
                <CardDescription>
                  Completed {new Date(check.completed_at || check.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              {check.notes && (
                <CardContent>
                  <p className="text-sm">{check.notes}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}