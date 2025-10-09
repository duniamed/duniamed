import { supabase } from '@/integrations/supabase/client';

export interface TrackEventOptions {
  eventName: string;
  eventType?: 'page_view' | 'click' | 'form_submit' | 'custom';
  metadata?: Record<string, any>;
  pageUrl?: string;
  referrer?: string;
}

let sessionId: string | null = null;

// Generate or retrieve session ID
function getSessionId(): string {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
  }
  return sessionId;
}

export async function trackEvent({
  eventName,
  eventType = 'custom',
  metadata = {},
  pageUrl,
  referrer
}: TrackEventOptions): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('track-event', {
      body: {
        eventName,
        eventType,
        metadata: {
          ...metadata,
          sessionId: getSessionId()
        },
        pageUrl: pageUrl || window.location.href,
        referrer: referrer || document.referrer
      }
    });

    if (error) {
      console.error('Error tracking event:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error tracking event:', error);
    return false;
  }
}

// Track page views automatically
export function trackPageView(pageName?: string) {
  trackEvent({
    eventName: pageName || document.title,
    eventType: 'page_view',
    metadata: {
      path: window.location.pathname,
      search: window.location.search
    }
  });
}

// Track button clicks
export function trackClick(buttonName: string, metadata?: Record<string, any>) {
  trackEvent({
    eventName: `click_${buttonName}`,
    eventType: 'click',
    metadata
  });
}