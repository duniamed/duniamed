import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ExternalLink } from 'lucide-react';

interface IntegrationCardProps {
  id: string;
  name: string;
  description: string;
  logo: string;
  category: string;
  isConnected?: boolean;
  onConnect: () => void;
  onDisconnect?: () => void;
}

export function IntegrationCard({
  id,
  name,
  description,
  logo,
  category,
  isConnected = false,
  onConnect,
  onDisconnect,
}: IntegrationCardProps) {
  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt={`${name} logo`} className="h-10 w-10 object-contain" />
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <Badge variant="outline" className="mt-1 text-xs">
                {category}
              </Badge>
            </div>
          </div>
          {isConnected && (
            <Badge variant="default" className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm mb-4 line-clamp-2">
          {description}
        </CardDescription>
        <div className="flex gap-2">
          {isConnected ? (
            <>
              <Button variant="outline" size="sm" className="flex-1" onClick={onDisconnect}>
                Disconnect
              </Button>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" className="w-full" onClick={onConnect}>
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}