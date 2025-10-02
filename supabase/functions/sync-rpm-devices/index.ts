import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeviceSyncData {
  userId: string;
  deviceId: string;
  deviceType: string;
  provider: "fitbit" | "apple_health" | "terra" | "withings";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, deviceId, deviceType, provider }: DeviceSyncData = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Syncing RPM device data:", { userId, deviceId, provider });

    // Get device credentials from secure storage
    const { data: deviceAuth } = await supabase
      .from("rpm_device_auth")
      .select("access_token, refresh_token, provider_user_id")
      .eq("user_id", userId)
      .eq("device_id", deviceId)
      .single();

    if (!deviceAuth) {
      throw new Error("Device not authenticated");
    }

    let healthData: any[] = [];

    // Route to appropriate provider API
    switch (provider) {
      case "fitbit":
        healthData = await syncFitbitData(deviceAuth.access_token, deviceType);
        break;
      case "terra":
        healthData = await syncTerraData(deviceAuth.access_token, deviceType);
        break;
      case "apple_health":
        healthData = await syncAppleHealthData(deviceAuth.access_token, deviceType);
        break;
      case "withings":
        healthData = await syncWithingsData(deviceAuth.access_token, deviceType);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // Store readings in database
    const readings = healthData.map((reading) => ({
      device_id: deviceId,
      reading_type: reading.type,
      value: reading.value,
      unit: reading.unit,
      recorded_at: reading.timestamp,
      is_flagged: checkThresholds(reading, deviceType),
      metadata: reading.metadata || {},
    }));

    const { data: insertedReadings, error: insertError } = await supabase
      .from("rpm_readings")
      .insert(readings)
      .select();

    if (insertError) {
      throw insertError;
    }

    // Update device last sync
    await supabase
      .from("rpm_devices")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", deviceId);

    // Check for flagged readings and create alerts
    const flaggedReadings = insertedReadings?.filter((r) => r.is_flagged) || [];
    
    if (flaggedReadings.length > 0) {
      await createAlerts(supabase, userId, deviceId, flaggedReadings);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Device data synced successfully",
        readingsCount: insertedReadings?.length || 0,
        flaggedCount: flaggedReadings.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("RPM device sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Provider-specific sync functions
async function syncFitbitData(accessToken: string, deviceType: string): Promise<any[]> {
  // Real implementation:
  // const fitbitApiUrl = "https://api.fitbit.com/1/user/-/";
  // const response = await fetch(`${fitbitApiUrl}activities/heart/date/today/1d.json`, {
  //   headers: { "Authorization": `Bearer ${accessToken}` },
  // });
  // const data = await response.json();
  // return parseHeartRateData(data);

  // Simulated data
  return [
    {
      type: "heart_rate",
      value: 72,
      unit: "bpm",
      timestamp: new Date().toISOString(),
      metadata: { source: "fitbit", deviceType },
    },
    {
      type: "blood_pressure_systolic",
      value: 120,
      unit: "mmHg",
      timestamp: new Date().toISOString(),
      metadata: { source: "fitbit", deviceType },
    },
  ];
}

async function syncTerraData(accessToken: string, deviceType: string): Promise<any[]> {
  // Terra API provides unified health data from multiple devices
  // const terraApiUrl = "https://api.tryterra.co/v2";
  // const response = await fetch(`${terraApiUrl}/daily`, {
  //   headers: { 
  //     "X-API-Key": Deno.env.get("TERRA_API_KEY"),
  //     "dev-id": Deno.env.get("TERRA_DEV_ID"),
  //   },
  // });
  
  return [
    {
      type: "steps",
      value: 8542,
      unit: "steps",
      timestamp: new Date().toISOString(),
      metadata: { source: "terra", deviceType },
    },
  ];
}

async function syncAppleHealthData(accessToken: string, deviceType: string): Promise<any[]> {
  // Apple Health Kit requires native iOS integration
  // Data would be sent from iOS app to this endpoint
  return [];
}

async function syncWithingsData(accessToken: string, deviceType: string): Promise<any[]> {
  // Withings API for connected scales and blood pressure monitors
  // const withingsApiUrl = "https://wbsapi.withings.net/measure";
  
  return [
    {
      type: "weight",
      value: 75.5,
      unit: "kg",
      timestamp: new Date().toISOString(),
      metadata: { source: "withings", deviceType },
    },
  ];
}

function checkThresholds(reading: any, deviceType: string): boolean {
  // Check against clinical thresholds
  const thresholds: Record<string, { min?: number; max?: number }> = {
    heart_rate: { min: 60, max: 100 },
    blood_pressure_systolic: { min: 90, max: 140 },
    blood_pressure_diastolic: { min: 60, max: 90 },
    blood_glucose: { min: 70, max: 180 },
    oxygen_saturation: { min: 95, max: 100 },
  };

  const threshold = thresholds[reading.type];
  if (!threshold) return false;

  const value = reading.value;
  return Boolean(
    (threshold.min !== undefined && value < threshold.min) ||
    (threshold.max !== undefined && value > threshold.max)
  );
}

async function createAlerts(
  supabase: any,
  userId: string,
  deviceId: string,
  flaggedReadings: any[]
): Promise<void> {
  const alerts = flaggedReadings.map((reading) => ({
    user_id: userId,
    device_id: deviceId,
    alert_type: "threshold_exceeded",
    severity: "medium",
    message: `${reading.reading_type} is outside normal range: ${reading.value} ${reading.unit}`,
    reading_id: reading.id,
    created_at: new Date().toISOString(),
  }));

  await supabase.from("rpm_alerts").insert(alerts);
}
