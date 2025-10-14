import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';

export default function RevenueOptimizationDashboard() {
  const metrics = [
    {
      title: 'Revenue Potential',
      value: '$125,000',
      change: '+18%',
      icon: DollarSign,
      color: 'text-green-500'
    },
    {
      title: 'Capacity Utilization',
      value: '78%',
      change: '+5%',
      icon: Users,
      color: 'text-blue-500'
    },
    {
      title: 'Avg Booking Lead Time',
      value: '4.2 days',
      change: '-12%',
      icon: Calendar,
      color: 'text-purple-500'
    },
    {
      title: 'Revenue per Hour',
      value: '$185',
      change: '+22%',
      icon: TrendingUp,
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Revenue Optimization</h2>
        <p className="text-muted-foreground">AI-powered revenue maximization insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <Card key={idx} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{metric.title}</p>
                <p className="text-3xl font-bold mb-1">{metric.value}</p>
                <Badge variant="secondary" className="text-xs">
                  {metric.change}
                </Badge>
              </div>
              <metric.icon className={`h-8 w-8 ${metric.color}`} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Optimization Opportunities</h3>
          <div className="space-y-3">
            {[
              { title: 'Peak Hour Pricing', impact: '$12,500/mo', priority: 'High' },
              { title: 'Fill Low-Demand Slots', impact: '$8,200/mo', priority: 'Medium' },
              { title: 'Reduce No-Shows', impact: '$15,000/mo', priority: 'High' },
              { title: 'Group Bookings', impact: '$5,500/mo', priority: 'Low' }
            ].map((opp, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-secondary rounded">
                <div>
                  <p className="font-medium text-sm">{opp.title}</p>
                  <p className="text-xs text-muted-foreground">{opp.impact}</p>
                </div>
                <Badge variant={opp.priority === 'High' ? 'default' : 'outline'}>
                  {opp.priority}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Forecasting</h3>
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 rounded">
              <p className="text-sm text-muted-foreground mb-1">Next Month Projection</p>
              <p className="text-3xl font-bold text-primary">$248,000</p>
              <p className="text-xs text-muted-foreground mt-2">Based on current trends and optimizations</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary rounded">
                <p className="text-xs text-muted-foreground">Best Case</p>
                <p className="text-xl font-bold">$275K</p>
              </div>
              <div className="p-3 bg-secondary rounded">
                <p className="text-xs text-muted-foreground">Conservative</p>
                <p className="text-xl font-bold">$220K</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
