/**
 * Edge Function Monitor Component
 * 
 * Displays real-time statistics about edge function false positive detection.
 * For development and monitoring purposes.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getEdgeFunctionErrorStats } from '@/lib/edgeFunctionErrorHandler';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export function EdgeFunctionMonitor() {
  const [stats, setStats] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or when explicitly enabled
    const shouldShow = process.env.NODE_ENV === 'development' || 
                      localStorage.getItem('showEdgeFunctionMonitor') === 'true';
    setIsVisible(shouldShow);

    if (!shouldShow) return;

    const updateStats = () => {
      const currentStats = getEdgeFunctionErrorStats();
      setStats(currentStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !stats) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Edge Function Monitor
          </CardTitle>
          <CardDescription className="text-xs">
            UNLIMITED CAPACITY - False Positive Detection Active
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <p className="text-muted-foreground">Platform Capacity</p>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                UNLIMITED
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Auto-Retry</p>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                <RefreshCw className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">False Positives Detected</span>
              <Badge variant="secondary">{stats.totalFalsePositives}</Badge>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Max Retry Attempts</span>
              <Badge variant="secondary">{stats.maxRetries}</Badge>
            </div>
          </div>

          {stats.totalFalsePositives > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium">Recent False Positives</p>
                  <p className="mt-1">
                    {stats.totalFalsePositives} false limit error(s) automatically handled
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              localStorage.setItem('showEdgeFunctionMonitor', 'false');
              setIsVisible(false);
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center pt-2 border-t border-border"
          >
            Hide Monitor
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

// Enable monitor visibility
export function enableEdgeFunctionMonitor() {
  localStorage.setItem('showEdgeFunctionMonitor', 'true');
  window.location.reload();
}

// Add to window for console access
if (typeof window !== 'undefined') {
  (window as any).enableEdgeFunctionMonitor = enableEdgeFunctionMonitor;
  (window as any).getEdgeFunctionStats = getEdgeFunctionErrorStats;
}
