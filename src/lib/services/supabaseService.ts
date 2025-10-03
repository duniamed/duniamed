// Centralized Supabase service layer
// Abstracts all direct Supabase calls for better maintainability and error handling

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { handleError } from '@/lib/errorHandler';

type Tables = Database['public']['Tables'];

// Generic query builder with error handling
class SupabaseService {
  // Appointments
  async getAppointments(userId: string, role: 'patient' | 'specialist') {
    try {
      const query = supabase
        .from('appointments')
        .select('*, specialist:specialists(*), patient:profiles(*)');
      
      if (role === 'patient') {
        query.eq('patient_id', userId);
      } else {
        query.eq('specialist_id', userId);
      }
      
      const { data, error } = await query.order('scheduled_at', { ascending: true });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      handleError(error, {
        title: 'Failed to fetch appointments',
        description: 'Could not load your appointments. Please try again.'
      });
      return { data: null, error };
    }
  }

  async createAppointment(appointment: Tables['appointments']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log audit trail
      await this.logSecurityAudit({
        action: 'create_appointment',
        resource_type: 'appointment',
        resource_id: data.id,
        metadata: { scheduled_at: appointment.scheduled_at }
      });
      
      return { data, error: null };
    } catch (error) {
      handleError(error, {
        title: 'Failed to create appointment',
        description: 'Could not create the appointment. Please try again.'
      });
      return { data: null, error };
    }
  }

  async updateAppointment(id: string, updates: Tables['appointments']['Update']) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      await this.logSecurityAudit({
        action: 'update_appointment',
        resource_type: 'appointment',
        resource_id: id,
        metadata: updates
      });
      
      return { data, error: null };
    } catch (error) {
      handleError(error, {
        title: 'Failed to update appointment',
        description: 'Could not update the appointment. Please try again.'
      });
      return { data: null, error };
    }
  }

  // Profiles
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      handleError(error, {
        title: 'Failed to fetch profile',
        description: 'Could not load profile data. Please try again.'
      });
      return { data: null, error };
    }
  }

  async updateProfile(userId: string, updates: Tables['profiles']['Update']) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      await this.logSecurityAudit({
        action: 'update_profile',
        resource_type: 'profile',
        resource_id: userId,
        metadata: updates
      });
      
      return { data, error: null };
    } catch (error) {
      handleError(error, {
        title: 'Failed to update profile',
        description: 'Could not update profile. Please try again.'
      });
      return { data: null, error };
    }
  }

  // Specialists
  async getSpecialists(filters?: {
    specialty?: string[];
    languages?: string[];
    minRating?: number;
    location?: string;
  }) {
    try {
      let query = supabase
        .from('specialists')
        .select('*, user:profiles(*)')
        .eq('is_accepting_patients', true);
      
      if (filters?.specialty && filters.specialty.length > 0) {
        query = query.contains('specialty', filters.specialty);
      }
      
      if (filters?.languages && filters.languages.length > 0) {
        query = query.contains('languages', filters.languages);
      }
      
      if (filters?.minRating) {
        query = query.gte('average_rating', filters.minRating);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      handleError(error, {
        title: 'Failed to search specialists',
        description: 'Could not search for specialists. Please try again.'
      });
      return { data: null, error };
    }
  }

  // Security & Audit
  async logSecurityAudit(log: {
    action: string;
    resource_type: string;
    resource_id?: string;
    metadata?: any;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // @ts-ignore - Table exists but types not regenerated yet
      await supabase.from('security_audit_log').insert({
        user_id: user?.id,
        action: log.action,
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        metadata: log.metadata,
        ip_address: null, // Would need server-side detection
        user_agent: navigator.userAgent
      });
    } catch (error) {
      // Silent fail for audit logs to not block main operations
      console.error('Failed to log security audit:', error);
    }
  }

  // Edge Functions
  async invokeEdgeFunction<T = any>(
    functionName: string,
    body?: any
  ): Promise<{ data: T | null; error: any }> {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      handleError(error, {
        title: 'Edge function error',
        description: `Failed to execute ${functionName}. Please try again.`
      });
      return { data: null, error };
    }
  }

  // Realtime subscriptions
  createRealtimeChannel(channelName: string) {
    return supabase.channel(channelName);
  }
}

export const supabaseService = new SupabaseService();
