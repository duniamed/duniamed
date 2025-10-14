import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface WorkQueueItemProps {
  item: {
    id: string;
    task_type: string;
    title: string;
    priority: string;
    status: string;
    due_date: string;
    patient_name?: string;
  };
  onAction?: (itemId: string, action: string) => void;
}

export const WorkQueueItem: React.FC<WorkQueueItemProps> = ({ item, onAction }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(item.status)}
              <h3 className="font-semibold">{item.title}</h3>
            </div>
            {item.patient_name && (
              <p className="text-sm text-muted-foreground">Patient: {item.patient_name}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getPriorityColor(item.priority) as any}>
                {item.priority}
              </Badge>
              <Badge variant="outline">{item.task_type}</Badge>
              <span className="text-xs text-muted-foreground">
                Due: {new Date(item.due_date).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction?.(item.id, 'view')}
            >
              View
            </Button>
            {item.status === 'pending' && (
              <Button
                size="sm"
                onClick={() => onAction?.(item.id, 'complete')}
              >
                Complete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
