import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MessageSquare } from 'lucide-react';

export default function VoiceAssistPage() {
  const [transcript, setTranscript] = useState<string[]>([]);

  return (
    <DashboardLayout title="Voice Assistant">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Voice Interface */}
          <VoiceAssistant
            sessionType="appointment"
            onTranscript={(text) => {
              setTranscript(prev => [...prev, text]);
            }}
          />

          {/* Transcript Display */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Conversation</h3>
            </div>
            
            <ScrollArea className="h-[400px] pr-4">
              {transcript.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Transcript will appear here</p>
                  <p className="text-sm mt-2">Start speaking to see the conversation</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transcript.map((text, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted">
                      <p className="text-sm text-foreground">{text}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>

        {/* Features */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
          <h3 className="text-lg font-semibold text-foreground mb-4">What You Can Do</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background/50">
              <h4 className="font-medium text-foreground mb-2">📅 Book Appointments</h4>
              <p className="text-sm text-muted-foreground">
                "Schedule an appointment with a cardiologist"
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <h4 className="font-medium text-foreground mb-2">🔍 Find Specialists</h4>
              <p className="text-sm text-muted-foreground">
                "Find a dermatologist near me"
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <h4 className="font-medium text-foreground mb-2">💊 Refill Prescriptions</h4>
              <p className="text-sm text-muted-foreground">
                "I need to refill my prescription"
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
