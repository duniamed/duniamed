import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AIChatbot } from '@/components/AIChatbot';
import { Card } from '@/components/ui/card';
import { MessageCircle, Clock, Users } from 'lucide-react';

export default function SupportChat() {
  return (
    <DashboardLayout title="Support Chat">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chatbot */}
          <div className="lg:col-span-2">
            <AIChatbot />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Stats */}
            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-foreground">AI Available Now</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Average response time: &lt; 1 second
              </p>
            </Card>

            {/* Quick Actions */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Quick Help</h3>
              <div className="space-y-2">
                <button className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors text-sm">
                  📅 Book an appointment
                </button>
                <button className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors text-sm">
                  🔍 Find a specialist
                </button>
                <button className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors text-sm">
                  💳 Insurance questions
                </button>
                <button className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors text-sm">
                  📝 Medical records
                </button>
              </div>
            </Card>

            {/* Stats */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Support Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">99.8%</p>
                    <p className="text-xs text-muted-foreground">Issues resolved by AI</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">24/7</p>
                    <p className="text-xs text-muted-foreground">Always available</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">15k+</p>
                    <p className="text-xs text-muted-foreground">Users helped today</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
