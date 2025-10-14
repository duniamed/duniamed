import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock } from 'lucide-react';

export default function PatientJourneyTracker() {
  const journeyStages = [
    { stage: 'Discovery', status: 'completed', date: '2024-01-15' },
    { stage: 'First Contact', status: 'completed', date: '2024-01-16' },
    { stage: 'Initial Consultation', status: 'completed', date: '2024-01-20' },
    { stage: 'Treatment Plan', status: 'current', date: '2024-01-22' },
    { stage: 'Follow-up', status: 'pending', date: 'TBD' },
    { stage: 'Outcome Evaluation', status: 'pending', date: 'TBD' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Patient Journey</h2>
        <p className="text-muted-foreground">Track patient progress through care pathway</p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {journeyStages.map((stage, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                {stage.status === 'completed' ? (
                  <CheckCircle className="h-6 w-6 text-success" />
                ) : stage.status === 'current' ? (
                  <Clock className="h-6 w-6 text-primary animate-pulse" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
                {idx < journeyStages.length - 1 && (
                  <div className={`w-0.5 h-12 mt-2 ${stage.status === 'completed' ? 'bg-success' : 'bg-muted'}`} />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium">{stage.stage}</h4>
                  <Badge variant={
                    stage.status === 'completed' ? 'default' : 
                    stage.status === 'current' ? 'secondary' : 'outline'
                  }>
                    {stage.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{stage.date}</p>
                
                {stage.status === 'current' && (
                  <div className="mt-3 p-3 bg-primary/10 rounded">
                    <p className="text-sm font-medium mb-2">Next Actions:</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Review lab results</li>
                      <li>• Schedule follow-up appointment</li>
                      <li>• Patient education materials sent</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Journey Metrics</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-secondary rounded text-center">
            <p className="text-2xl font-bold">85%</p>
            <p className="text-xs text-muted-foreground mt-1">Completion Rate</p>
          </div>
          <div className="p-3 bg-secondary rounded text-center">
            <p className="text-2xl font-bold">42 days</p>
            <p className="text-xs text-muted-foreground mt-1">Avg Journey Time</p>
          </div>
          <div className="p-3 bg-secondary rounded text-center">
            <p className="text-2xl font-bold">4.5/5</p>
            <p className="text-xs text-muted-foreground mt-1">Satisfaction</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
