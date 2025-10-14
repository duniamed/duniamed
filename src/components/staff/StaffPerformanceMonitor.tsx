import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, TrendingUp, Award } from 'lucide-react';

export default function StaffPerformanceMonitor() {
  const staffMembers = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Cardiologist',
      score: 98,
      patients: 145,
      rating: 4.9,
      trend: '+5%'
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Pediatrician',
      score: 95,
      patients: 132,
      rating: 4.8,
      trend: '+3%'
    },
    {
      name: 'Dr. Emily Rodriguez',
      role: 'General Practice',
      score: 92,
      patients: 158,
      rating: 4.7,
      trend: '+8%'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Staff Performance</h2>
        <p className="text-muted-foreground">Real-time performance metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Award className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium">Top Performer</span>
          </div>
          <p className="text-2xl font-bold">Dr. Sarah Johnson</p>
          <p className="text-sm text-muted-foreground">98/100 Score</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium">Most Improved</span>
          </div>
          <p className="text-2xl font-bold">Dr. Emily Rodriguez</p>
          <p className="text-sm text-muted-foreground">+8% this month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Star className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Avg Team Rating</span>
          </div>
          <p className="text-2xl font-bold">4.8/5.0</p>
          <p className="text-sm text-muted-foreground">Based on 435 reviews</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Individual Performance</h3>
        <div className="space-y-4">
          {staffMembers.map((staff, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-secondary rounded">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{staff.name}</p>
                  <p className="text-sm text-muted-foreground">{staff.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-lg font-bold">{staff.score}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Patients</p>
                  <p className="text-lg font-bold">{staff.patients}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <p className="text-lg font-bold">{staff.rating}</p>
                  </div>
                </div>
                <Badge variant="secondary">{staff.trend}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
          <div className="space-y-3">
            {[
              { label: 'Patient Satisfaction', value: '4.8/5', color: 'bg-green-500' },
              { label: 'Response Time', value: '< 2 min', color: 'bg-blue-500' },
              { label: 'Completion Rate', value: '96%', color: 'bg-purple-500' },
              { label: 'Documentation Quality', value: '94%', color: 'bg-orange-500' }
            ].map((metric, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${metric.color}`} />
                  <span className="text-sm">{metric.label}</span>
                </div>
                <span className="font-semibold">{metric.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recognition</h3>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <p className="text-sm font-medium">🏆 Excellence Award</p>
              <p className="text-xs text-muted-foreground mt-1">Dr. Sarah Johnson - Outstanding patient care</p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
              <p className="text-sm font-medium">⭐ Rising Star</p>
              <p className="text-xs text-muted-foreground mt-1">Dr. Emily Rodriguez - Most improved specialist</p>
            </div>
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
              <p className="text-sm font-medium">💚 Patient Favorite</p>
              <p className="text-xs text-muted-foreground mt-1">Dr. Michael Chen - Highest patient ratings</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
