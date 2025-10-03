import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReviewResponse {
  id: string;
  review_id: string;
  responder_id: string;
  responder_type: string;
  response_text: string;
  attachments: any[];
  mediation_tag: string | null;
  is_internal: boolean;
  created_at: string;
}

interface MediationThread {
  id: string;
  review_id: string;
  status: string;
  resolution_summary: string | null;
  created_at: string;
  resolved_at: string | null;
}

export default function ReviewResponses() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<ReviewResponse[]>([]);
  const [threads, setThreads] = useState<MediationThread[]>([]);
  const [newResponse, setNewResponse] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState("");
  const [mediationTag, setMediationTag] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load review responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('review_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (responsesError) throw responsesError;
      setResponses(responsesData || []);

      // Load mediation threads
      const { data: threadsData, error: threadsError } = await supabase
        .from('review_mediation_threads')
        .select('*')
        .order('created_at', { ascending: false });

      if (threadsError) throw threadsError;
      setThreads(threadsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load review responses.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async () => {
    if (!newResponse.trim() || !selectedReviewId) {
      toast({
        title: "Missing Information",
        description: "Please enter a response and select a review.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('review_responses')
        .insert({
          review_id: selectedReviewId,
          responder_id: user.id,
          responder_type: 'specialist',
          response_text: newResponse,
          mediation_tag: mediationTag || null,
          is_internal: false,
        });

      if (error) throw error;

      toast({
        title: "Response Submitted",
        description: "Your response has been posted successfully.",
      });

      setNewResponse("");
      setMediationTag("");
      loadData();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-500',
      under_review: 'bg-yellow-500',
      resolved: 'bg-green-500',
      escalated: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            Review Responses & Mediation
            <InfoTooltip content="View and respond to patient reviews. Engage in mediation threads with secure evidence exchange and legal documentation support." />
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your review responses and participate in mediation processes
          </p>
        </div>

        <div className="grid gap-6">
          {/* Submit New Response */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submit Response
                <InfoTooltip content="Respond to patient reviews professionally. Add mediation tags for formal dispute resolution and attach supporting evidence." />
              </CardTitle>
              <CardDescription>
                Reply to a review or provide evidence in a mediation case
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Review ID</label>
                <input
                  type="text"
                  value={selectedReviewId}
                  onChange={(e) => setSelectedReviewId(e.target.value)}
                  placeholder="Enter review ID"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Mediation Tag (Optional)</label>
                <Select value={mediationTag} onValueChange={setMediationTag}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="evidence">Evidence</SelectItem>
                    <SelectItem value="clarification">Clarification</SelectItem>
                    <SelectItem value="resolution">Resolution</SelectItem>
                    <SelectItem value="appeal">Appeal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Your Response</label>
                <Textarea
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  placeholder="Write your professional response..."
                  rows={4}
                />
              </div>

              <Button onClick={submitResponse} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Response
              </Button>
            </CardContent>
          </Card>

          {/* Active Mediation Threads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Active Mediation Threads
                <InfoTooltip content="Track ongoing mediation cases. View status updates, resolution summaries, and participate in secure evidence exchange." />
              </CardTitle>
              <CardDescription>
                Monitor and participate in active dispute resolution cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {threads.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No active mediation threads
                </p>
              ) : (
                <div className="space-y-4">
                  {threads.map((thread) => (
                    <div key={thread.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Thread #{thread.id.slice(0, 8)}</span>
                        <Badge className={getStatusColor(thread.status)}>
                          {thread.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Review ID: {thread.review_id.slice(0, 8)}
                      </p>
                      {thread.resolution_summary && (
                        <div className="mt-2 p-2 bg-muted rounded">
                          <p className="text-sm font-medium flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Resolution Summary
                          </p>
                          <p className="text-sm mt-1">{thread.resolution_summary}</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Created: {new Date(thread.created_at).toLocaleDateString()}
                        {thread.resolved_at && ` • Resolved: ${new Date(thread.resolved_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Responses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Responses
                <InfoTooltip content="View all responses to patient reviews, including mediation tags and timestamps for audit purposes." />
              </CardTitle>
              <CardDescription>
                View recent responses and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {responses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No responses yet
                </p>
              ) : (
                <div className="space-y-4">
                  {responses.slice(0, 10).map((response) => (
                    <div key={response.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{response.responder_type}</Badge>
                        {response.mediation_tag && (
                          <Badge variant="secondary">{response.mediation_tag}</Badge>
                        )}
                      </div>
                      <p className="text-sm">{response.response_text}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(response.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
