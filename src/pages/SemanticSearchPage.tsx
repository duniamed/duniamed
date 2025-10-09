import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SemanticSearch } from '@/components/SemanticSearch';
import { Card } from '@/components/ui/card';
import { Search, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SemanticSearchPage() {
  const { t } = useTranslation();

  return (
    <DashboardLayout title="Semantic Search">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">AI-Powered Search</h2>
              <p className="text-muted-foreground">
                Find users, specialists, and clinics using natural language
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-background/50">
              <h3 className="font-semibold text-foreground mb-2">🔍 Smart Matching</h3>
              <p className="text-sm text-muted-foreground">
                Search understands context and finds relevant results
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <h3 className="font-semibold text-foreground mb-2">⚡ Instant Results</h3>
              <p className="text-sm text-muted-foreground">
                Get results as you type with AI-powered suggestions
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <h3 className="font-semibold text-foreground mb-2">🎯 Precise Matching</h3>
              <p className="text-sm text-muted-foreground">
                Similarity scores show how well each result matches
              </p>
            </div>
          </div>
        </Card>

        {/* Search Component */}
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <SemanticSearch />
        </div>

        {/* Examples */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Example Searches</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <p className="text-sm text-foreground">"Cardiologist with experience in heart surgery"</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <p className="text-sm text-foreground">"Clinic specializing in pediatric care"</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <p className="text-sm text-foreground">"Telemedicine specialist for mental health"</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <p className="text-sm text-foreground">"Doctor who speaks Spanish and treats diabetes"</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
