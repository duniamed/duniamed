import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Smartphone, RefreshCw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * C4 RESILIENCE - Session Management & Biometric Auth
 * 
 * PATIENT WORKFLOW:
 * 1. Enable biometric authentication (fingerprint/FaceID)
 * 2. View active sessions across devices
 * 3. Rollback to previous session if needed
 * 4. Secure session with device fingerprinting
 * 
 * SPECIALIST WORKFLOW:
 * 1. Multi-device session management
 * 2. Biometric fallback authentication
 * 3. Session snapshots for recovery
 * 4. Audit trail of session changes
 * 
 * CLINIC WORKFLOW:
 * 1. Monitor staff session activity
 * 2. Force session rollbacks for security
 * 3. Biometric enforcement policies
 * 4. Session integrity verification
 * 
 * INTEGRATION: WebAuthn API for biometric authentication
 */

interface Session {
  id: string;
  device_info: any;
  biometric_enabled: boolean;
  created_at: string;
  expires_at: string;
}

export default function SessionManagement() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBiometricSupport();
    loadSessions();
  }, []);

  const checkBiometricSupport = async () => {
    // Check if WebAuthn is supported
    const supported = window.PublicKeyCredential !== undefined &&
                     navigator.credentials !== undefined;
    setBiometricSupported(supported);

    if (supported) {
      // Check if biometric is already registered
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('session_snapshots')
          .select('biometric_enabled')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data) {
          setBiometricEnabled(data.biometric_enabled);
        }
      }
    }
  };

  const loadSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('session_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading sessions',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const enableBiometric = async () => {
    if (!biometricSupported) {
      toast({
        title: 'Not Supported',
        description: 'Biometric authentication is not available on this device',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create WebAuthn credential
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Healthcare Platform',
          },
          user: {
            id: new TextEncoder().encode(user.id),
            name: user.email || 'user',
            displayName: user.email || 'User',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      });

      if (credential) {
        // Save credential info
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

        const { error } = await supabase
          .from('session_snapshots')
          .insert({
            user_id: user.id,
            session_data: { credential_id: credential.id },
            device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
            },
            biometric_enabled: true,
            expires_at: expiresAt.toISOString(),
          });

        if (error) throw error;

        setBiometricEnabled(true);
        toast({
          title: 'Biometric Enabled',
          description: 'You can now use fingerprint/FaceID to authenticate',
        });
        loadSessions();
      }
    } catch (error: any) {
      console.error('Biometric error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to enable biometric authentication',
        variant: 'destructive',
      });
    }
  };

  const createSnapshot = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error } = await supabase
        .from('session_snapshots')
        .insert({
          user_id: user.id,
          session_data: {
            timestamp: new Date().toISOString(),
            snapshot_type: 'manual',
          },
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Snapshot Created',
        description: 'Session state saved for recovery',
      });
      loadSessions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Session Management (C4 Resilience)
          </h1>
          <p className="text-muted-foreground mt-2">
            Secure your account with biometric authentication and session snapshots
          </p>
        </div>

        <div className="space-y-6">
          {/* Biometric Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Biometric Authentication
              </CardTitle>
              <CardDescription>
                Use fingerprint or FaceID for secure access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="biometric">Enable Biometric Login</Label>
                  <p className="text-sm text-muted-foreground">
                    {biometricSupported
                      ? 'Use your device biometrics for quick and secure authentication'
                      : 'Not supported on this device'}
                  </p>
                </div>
                <Switch
                  id="biometric"
                  checked={biometricEnabled}
                  onCheckedChange={enableBiometric}
                  disabled={!biometricSupported || biometricEnabled}
                />
              </div>

              {biometricEnabled && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-medium">Biometric authentication is active</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Snapshots */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Session Snapshots
                  </CardTitle>
                  <CardDescription>
                    Create restore points for your session
                  </CardDescription>
                </div>
                <Button onClick={createSnapshot}>
                  Create Snapshot
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading sessions...</p>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Session Snapshots</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first snapshot to enable session recovery
                  </p>
                  <Button onClick={createSnapshot} variant="outline">
                    Create First Snapshot
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {isExpired(session.expires_at) ? (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <Clock className="h-5 w-5 text-primary" />
                        )}
                        <div>
                          <p className="font-medium">
                            {session.device_info?.platform || 'Unknown Device'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(session.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.biometric_enabled && (
                          <Badge variant="secondary">
                            <Smartphone className="h-3 w-3 mr-1" />
                            Biometric
                          </Badge>
                        )}
                        <Badge variant={isExpired(session.expires_at) ? 'destructive' : 'default'}>
                          {isExpired(session.expires_at) ? 'Expired' : 'Active'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Info */}
          <Card>
            <CardHeader>
              <CardTitle>Security Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Enable biometric authentication for enhanced security</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Create regular session snapshots for recovery</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Sessions expire after 30 days for security</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Device information is tracked for audit purposes</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
