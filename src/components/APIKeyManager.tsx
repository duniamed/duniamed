import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Key, Copy, Trash2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function APIKeyManager() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const { toast } = useToast();

  const loadKeys = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-api-keys', {
        body: { action: 'list' }
      });

      if (error) throw error;
      setKeys(data.keys || []);
    } catch (error: any) {
      console.error('Error loading API keys:', error);
    }
  };

  const createKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the API key",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-api-keys', {
        body: {
          action: 'create',
          name: newKeyName
        }
      });

      if (error) throw error;

      setNewKey(data.key);
      toast({
        title: "API Key Created",
        description: "Copy your key now - it won't be shown again",
      });

      await loadKeys();
      setNewKeyName('');
    } catch (error: any) {
      console.error('Error creating API key:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create API key",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const revokeKey = async (keyId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-api-keys', {
        body: {
          action: 'revoke',
          keyId
        }
      });

      if (error) throw error;

      toast({
        title: "Key Revoked",
        description: "API key has been revoked successfully",
      });

      await loadKeys();
    } catch (error: any) {
      console.error('Error revoking API key:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to revoke API key",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  useEffect(() => {
    loadKeys();
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">API Keys</h2>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key for accessing your account programmatically
              </DialogDescription>
            </DialogHeader>

            {newKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">Your API Key</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-background p-2 rounded flex-1 break-all">
                      {newKey}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(newKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-destructive">
                  ⚠️ Copy this key now - it won't be shown again!
                </p>
                <Button
                  onClick={() => {
                    setNewKey(null);
                    setShowCreateDialog(false);
                  }}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="key-name">Key Name</Label>
                  <Input
                    id="key-name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Production API Key"
                  />
                </div>
                <Button onClick={createKey} disabled={loading} className="w-full">
                  Generate Key
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {keys.length === 0 ? (
          <div className="text-center py-12">
            <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No API keys yet</p>
          </div>
        ) : (
          keys.map((key) => (
            <div
              key={key.id}
              className="p-4 border border-border rounded-lg flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground">{key.name}</p>
                  <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                    {key.status}
                  </Badge>
                </div>
                <code className="text-sm text-muted-foreground">{key.key_prefix}...</code>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                  {key.last_used_at && (
                    <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {key.status === 'active' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently revoke the API key. Any applications using this key
                        will no longer be able to access your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => revokeKey(key.id)}>
                        Revoke
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}