import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";

interface SlotCountdownProps {
  expiresAt: string; // ISO timestamp
  onExpire?: () => void;
}

export function SlotCountdown({ expiresAt, onExpire }: SlotCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      return diff;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isUrgent = timeLeft <= 30; // Last 30 seconds
  const isCritical = timeLeft <= 10; // Last 10 seconds

  return (
    <Card
      className={`border-2 transition-all duration-300 ${
        isCritical
          ? "border-red-500 bg-red-50 dark:bg-red-950 animate-pulse"
          : isUrgent
          ? "border-orange-500 bg-orange-50 dark:bg-orange-950"
          : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
      }`}
    >
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          {isCritical ? (
            <AlertTriangle className="w-8 h-8 text-red-600 animate-bounce" />
          ) : (
            <Clock className="w-8 h-8 text-orange-600" />
          )}

          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-2">
              <span
                className={`text-4xl font-bold tabular-nums ${
                  isCritical
                    ? "text-red-600"
                    : isUrgent
                    ? "text-orange-600"
                    : "text-yellow-600"
                }`}
              >
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
              <span className="text-sm text-muted-foreground">remaining</span>
            </div>

            <p
              className={`text-sm font-semibold ${
                isCritical
                  ? "text-red-700"
                  : isUrgent
                  ? "text-orange-700"
                  : "text-yellow-700"
              }`}
            >
              {isCritical
                ? "🚨 LAST SECONDS! Complete booking NOW or lose this slot!"
                : isUrgent
                ? "⚠️ Time running out! Someone else may take this slot."
                : "⏱️ Your exclusive hold - Complete booking to secure"}
            </p>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  isCritical
                    ? "bg-red-600"
                    : isUrgent
                    ? "bg-orange-500"
                    : "bg-yellow-500"
                }`}
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
