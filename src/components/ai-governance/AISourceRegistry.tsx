import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type SourceType = 'guideline' | 'ontology' | 'formulary' | 'internal_protocol' | 'journal_api' | 'fhir_resource';
type SourceStatus = 'approved' | 'pending' | 'retired' | 'under_review';

interface AISource {
  id: string;
  source_key: string;
  source_type: SourceType;
  name: string;
  uri: string;
  version: string;
  valid_from: string;
  valid_to: string | null;
  checksum: string | null;
  retrieval_method: string;
  status: SourceStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function AISourceRegistry() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: sources, isLoading } = useQuery({
    queryKey: ['aiSources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_source_registry')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AISource[];
    }
  });

  const createSourceMutation = useMutation({
    mutationFn: async (newSource: any) => {
      const { data, error } = await supabase
        .from('ai_source_registry')
        .insert(newSource as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiSources'] });
      toast.success('Medical source added successfully');
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add source: ${error.message}`);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SourceStatus }) => {
      const { error } = await supabase
        .from('ai_source_registry')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiSources'] });
      toast.success('Source status updated');
    }
  });

  const getStatusColor = (status: SourceStatus) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'under_review': return 'outline';
      case 'retired': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: SourceStatus) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'pending': return Clock;
      case 'under_review': return AlertCircle;
      case 'retired': return AlertCircle;
      default: return Clock;
    }
  };

  if (isLoading) {
    return <div>Loading sources...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {sources?.filter(s => s.status === 'approved').length || 0} approved source(s)
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Medical Source</DialogTitle>
              <DialogDescription>
                Register a new approved medical knowledge source for AI retrieval
              </DialogDescription>
            </DialogHeader>
            <SourceForm
              onSubmit={(data) => createSourceMutation.mutate(data)}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sources?.map((source) => {
          const StatusIcon = getStatusIcon(source.status);
          const isStale = source.valid_to && new Date(source.valid_to) < new Date();

          return (
            <div
              key={source.id}
              className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{source.name}</h3>
                    <Badge variant={getStatusColor(source.status)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {source.status}
                    </Badge>
                    {isStale && (
                      <Badge variant="destructive">Stale</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {source.source_key} • {source.source_type} • v{source.version}
                  </div>
                </div>
                {source.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ id: source.id, status: 'approved' })}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                )}
              </div>

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">URI:</span>
                  <span className="font-mono text-xs">{source.uri}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Retrieval:</span>
                  <span>{source.retrieval_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valid:</span>
                  <span>
                    {format(new Date(source.valid_from), 'MMM d, yyyy')}
                    {source.valid_to && ` - ${format(new Date(source.valid_to), 'MMM d, yyyy')}`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SourceForm({ onSubmit, onCancel }: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    source_key: '',
    source_type: 'guideline' as SourceType,
    name: '',
    uri: '',
    version: '1.0',
    retrieval_method: 'api',
    status: 'pending' as SourceStatus
  });

  const handleSubmit = () => {
    if (!formData.source_key || !formData.name || !formData.uri) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="source_key">Source Key*</Label>
        <Input
          id="source_key"
          value={formData.source_key}
          onChange={(e) => setFormData({ ...formData, source_key: e.target.value })}
          placeholder="e.g., uptodate_2024"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name*</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., UpToDate Clinical Guidelines"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="source_type">Source Type</Label>
        <Select value={formData.source_type} onValueChange={(value) => setFormData({ ...formData, source_type: value as SourceType })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="guideline">Clinical Guideline</SelectItem>
            <SelectItem value="ontology">Medical Ontology</SelectItem>
            <SelectItem value="formulary">Formulary/Drug Database</SelectItem>
            <SelectItem value="internal_protocol">Internal Protocol</SelectItem>
            <SelectItem value="journal_api">Journal API</SelectItem>
            <SelectItem value="fhir_resource">FHIR Resource</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="uri">URI/Endpoint*</Label>
        <Input
          id="uri"
          value={formData.uri}
          onChange={(e) => setFormData({ ...formData, uri: e.target.value })}
          placeholder="https://api.example.com/v1/guidelines"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="retrieval_method">Retrieval Method</Label>
          <Select value={formData.retrieval_method} onValueChange={(value) => setFormData({ ...formData, retrieval_method: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="vectordb">Vector DB</SelectItem>
              <SelectItem value="bm25">BM25 Search</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>Add Source</Button>
      </DialogFooter>
    </div>
  );
}
