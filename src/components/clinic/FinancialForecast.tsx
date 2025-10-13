import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FinancialForecastProps {
  bookedAppointments?: any[];
}

export function FinancialForecast({ bookedAppointments = [] }: FinancialForecastProps) {
  // Calculate revenue forecast based on booked future appointments
  const calculateForecast = () => {
    const today = new Date();
    const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const futureAppointments = bookedAppointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_at);
      return aptDate > today && aptDate <= next30Days;
    });

    const forecastRevenue = futureAppointments.reduce((sum, apt) => sum + (apt.fee || 0), 0);
    const averagePerConsult = forecastRevenue / (futureAppointments.length || 1);

    // Create weekly forecast data
    const weeklyData = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(today.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const weekAppointments = futureAppointments.filter(apt => {
        const aptDate = new Date(apt.scheduled_at);
        return aptDate >= weekStart && aptDate < weekEnd;
      });

      weeklyData.push({
        week: `Week ${i + 1}`,
        revenue: weekAppointments.reduce((sum, apt) => sum + (apt.fee || 0), 0),
        appointments: weekAppointments.length
      });
    }

    return { forecastRevenue, averagePerConsult, weeklyData, totalBooked: futureAppointments.length };
  };

  const { forecastRevenue, averagePerConsult, weeklyData, totalBooked } = calculateForecast();

  return (
    <div className="space-y-4">
      {/* Forecast Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">30-Day Forecast</p>
                <p className="text-2xl font-bold text-green-500">
                  ${forecastRevenue.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {totalBooked} booked appointments
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Per Consultation</p>
                <p className="text-2xl font-bold text-blue-500">
                  ${averagePerConsult.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Booked Appointments</p>
                <p className="text-2xl font-bold text-purple-500">
                  {totalBooked}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Revenue Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => [`$${value.toFixed(2)}`, 'Revenue']}
                labelFormatter={(label) => `${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
