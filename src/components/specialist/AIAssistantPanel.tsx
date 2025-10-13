import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lightbulb, Pill, FileText, FlaskConical, Calendar, Plus } from 'lucide-react';

interface AISuggestion {
  type: 'icd10' | 'prescription' | 'protocol' | 'lab' | 'followup';
  title: string;
  description: string;
  code?: string;
  confidence?: number;
}

interface AIAssistantPanelProps {
  suggestions: AISuggestion[];
  onAddSuggestion: (suggestion: AISuggestion) => void;
}

export function AIAssistantPanel({ suggestions, onAddSuggestion }: AIAssistantPanelProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'icd10':
        return <FileText className="h-4 w-4" />;
      case 'prescription':
        return <Pill className="h-4 w-4" />;
      case 'protocol':
        return <Lightbulb className="h-4 w-4" />;
      case 'lab':
        return <FlaskConical className="h-4 w-4" />;
      case 'followup':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'icd10':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'prescription':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'protocol':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'lab':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'followup':
        return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'icd10':
        return 'ICD-10 Code';
      case 'prescription':
        return 'Prescription';
      case 'protocol':
        return 'Treatment Protocol';
      case 'lab':
        return 'Lab Test';
      case 'followup':
        return 'Follow-up';
      default:
        return 'Suggestion';
    }
  };

  return (
    <Card className="h-full border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI Assistant</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Real-time suggestions based on your conversation</p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-3">
            {suggestions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">AI suggestions will appear here as you speak during the consultation</p>
              </div>
            ) : (
              suggestions.map((suggestion, index) => (
                <Card key={index} className="group hover:shadow-md transition-all duration-200 hover:border-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${getTypeColor(suggestion.type)}`}>
                          {getIcon(suggestion.type)}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className={`text-xs ${getTypeColor(suggestion.type)}`}>
                            {getTypeLabel(suggestion.type)}
                          </Badge>
                          {suggestion.confidence && (
                            <span className="text-xs text-muted-foreground">
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onAddSuggestion(suggestion)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <h4 className="font-semibold mb-1 text-sm">{suggestion.title}</h4>
                    {suggestion.code && (
                      <p className="text-xs font-mono text-muted-foreground mb-2">{suggestion.code}</p>
                    )}
                    <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.description}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
