import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';

/**
 * C4 RESILIENCE - Guided Recovery After Failures
 * 
 * PATIENT WORKFLOW:
 * 1. System detects failure (payment, booking, upload)
 * 2. Clear error message with recovery steps
 * 3. Guided step-by-step recovery process
 * 4. Alternative methods offered
 * 5. Progress saved, can resume later
 * 
 * INTEGRATION:
 * - Error tracking via APM
 * - Session state preservation
 * - Auto-retry with exponential backoff
 */

interface GuidedRecoveryProps {
  errorType: 'payment' | 'booking' | 'upload' | 'network' | 'auth';
  errorMessage: string;
  onRetry: () => Promise<void>;
  onAlternative?: () => void;
  context?: Record<string, any>;
}

export function GuidedRecovery({ 
  errorType, 
  errorMessage, 
  onRetry, 
  onAlternative,
  context 
}: GuidedRecoveryProps) {
  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [recovered, setRecovered] = useState(false);

  const getRecoverySteps = () => {
    switch (errorType) {
      case 'payment':
        return [
          'Verify payment method is valid and has sufficient funds',
          'Check if your bank is blocking online transactions',
          'Try an alternative payment method',
          'Contact your bank if issue persists'
        ];
      case 'booking':
        return [
          'Verify the time slot is still available',
          'Check your internet connection',
          'Try selecting an alternative time',
          'Contact support if you need assistance'
        ];
      case 'upload':
        return [
          'Check file size (must be under 10MB)',
          'Ensure file format is supported',
          'Verify stable internet connection',
          'Try compressing the file'
        ];
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Clear browser cache',
          'Switch to a different network if available'
        ];
      case 'auth':
        return [
          'Verify your credentials are correct',
          'Check if caps lock is on',
          'Reset password if forgotten',
          'Clear cookies and try again'
        ];
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      await onRetry();
      setRecovered(true);
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setRetrying(false);
    }
  };

  if (recovered) {
    return (
      <Card className="border-green-500">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Recovery Successful!</h3>
            <p className="text-muted-foreground">
              Your action has been completed successfully.
            </p>
            <Button onClick={() => window.location.reload()}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-500">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <CardTitle>Action Failed - Let's Fix This</CardTitle>
        </div>
        <CardDescription>{errorMessage}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recovery Steps */}
        <div className="space-y-2">
          <h4 className="font-medium">Recovery Steps:</h4>
          <ol className="space-y-2">
            {getRecoverySteps().map((step, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Retry Progress */}
        {retryCount > 0 && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm">
              Retry attempts: <Badge variant="secondary">{retryCount}</Badge>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleRetry} 
            disabled={retrying}
            className="flex-1"
          >
            {retrying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </>
            )}
          </Button>
          {onAlternative && (
            <Button 
              variant="outline" 
              onClick={onAlternative}
              className="flex-1"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Try Alternative
            </Button>
          )}
        </div>

        {/* Support Contact */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Still having trouble?{' '}
            <Button variant="link" className="px-1" onClick={() => window.location.href = '/chat'}>
              Contact Support
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
