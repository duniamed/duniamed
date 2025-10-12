export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_type: string
          balance: number
          clinic_id: string | null
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type: string
          balance?: number
          clinic_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          balance?: number
          clinic_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          changes: Json | null
          created_at: string | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      ai_assistant_sessions: {
        Row: {
          ai_interactions: Json | null
          completed_at: string | null
          context: Json | null
          created_at: string | null
          id: string
          outcome: Json | null
          session_type: string
          user_id: string
        }
        Insert: {
          ai_interactions?: Json | null
          completed_at?: string | null
          context?: Json | null
          created_at?: string | null
          id?: string
          outcome?: Json | null
          session_type: string
          user_id: string
        }
        Update: {
          ai_interactions?: Json | null
          completed_at?: string | null
          context?: Json | null
          created_at?: string | null
          id?: string
          outcome?: Json | null
          session_type?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_config_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          change_note: string | null
          compliance_layers: Json
          context: Database["public"]["Enums"]["ai_context"]
          created_at: string
          created_by: string
          data_access_scope: Json
          id: string
          is_active: boolean
          name: string
          responsiveness: Json
          updated_at: string
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          change_note?: string | null
          compliance_layers?: Json
          context: Database["public"]["Enums"]["ai_context"]
          created_at?: string
          created_by: string
          data_access_scope?: Json
          id?: string
          is_active?: boolean
          name: string
          responsiveness?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          change_note?: string | null
          compliance_layers?: Json
          context?: Database["public"]["Enums"]["ai_context"]
          created_at?: string
          created_by?: string
          data_access_scope?: Json
          id?: string
          is_active?: boolean
          name?: string
          responsiveness?: Json
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      ai_policy_audit: {
        Row: {
          action: Database["public"]["Enums"]["ai_audit_action"]
          actor_id: string
          config_id: string | null
          diff: Json | null
          id: string
          ip_address: string | null
          justification: string
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["ai_audit_action"]
          actor_id: string
          config_id?: string | null
          diff?: Json | null
          id?: string
          ip_address?: string | null
          justification: string
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["ai_audit_action"]
          actor_id?: string
          config_id?: string | null
          diff?: Json | null
          id?: string
          ip_address?: string | null
          justification?: string
          timestamp?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_policy_audit_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "ai_config_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sandbox_sessions: {
        Row: {
          config_snapshot: Json
          config_version: number | null
          created_at: string
          ended_at: string | null
          id: string
          notes: string | null
          source_scope_snapshot: Json
          started_by: string
          status: string
          test_results: Json | null
        }
        Insert: {
          config_snapshot: Json
          config_version?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          source_scope_snapshot: Json
          started_by: string
          status?: string
          test_results?: Json | null
        }
        Update: {
          config_snapshot?: Json
          config_version?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          source_scope_snapshot?: Json
          started_by?: string
          status?: string
          test_results?: Json | null
        }
        Relationships: []
      }
      ai_source_registry: {
        Row: {
          checksum: string | null
          created_at: string
          id: string
          metadata: Json | null
          name: string
          retrieval_method: string | null
          source_key: string
          source_type: Database["public"]["Enums"]["ai_source_type"]
          status: Database["public"]["Enums"]["ai_source_status"]
          updated_at: string
          uri: string
          valid_from: string
          valid_to: string | null
          version: string
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name: string
          retrieval_method?: string | null
          source_key: string
          source_type: Database["public"]["Enums"]["ai_source_type"]
          status?: Database["public"]["Enums"]["ai_source_status"]
          updated_at?: string
          uri: string
          valid_from?: string
          valid_to?: string | null
          version: string
        }
        Update: {
          checksum?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          retrieval_method?: string | null
          source_key?: string
          source_type?: Database["public"]["Enums"]["ai_source_type"]
          status?: Database["public"]["Enums"]["ai_source_status"]
          updated_at?: string
          uri?: string
          valid_from?: string
          valid_to?: string | null
          version?: string
        }
        Relationships: []
      }
      ai_symptom_checker_modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          last_validated_at: string | null
          module_key: string
          owning_team: string | null
          status: string
          storage_ref: string
          version: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          last_validated_at?: string | null
          module_key: string
          owning_team?: string | null
          status?: string
          storage_ref: string
          version: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          last_validated_at?: string | null
          module_key?: string
          owning_team?: string | null
          status?: string
          storage_ref?: string
          version?: string
        }
        Relationships: []
      }
      ai_symptom_logs: {
        Row: {
          citations: Json
          context: Database["public"]["Enums"]["ai_context"]
          evaluator_scores: Json | null
          flags: Json | null
          geo_region: string | null
          id: string
          inputs_hash: string
          inputs_schema: Json | null
          latency_ms: number | null
          output_schema: Json | null
          output_summary: string | null
          request_id: string
          retrieved_sources: Json
          timestamp: string
          user_role: string | null
        }
        Insert: {
          citations?: Json
          context: Database["public"]["Enums"]["ai_context"]
          evaluator_scores?: Json | null
          flags?: Json | null
          geo_region?: string | null
          id?: string
          inputs_hash: string
          inputs_schema?: Json | null
          latency_ms?: number | null
          output_schema?: Json | null
          output_summary?: string | null
          request_id?: string
          retrieved_sources?: Json
          timestamp?: string
          user_role?: string | null
        }
        Update: {
          citations?: Json
          context?: Database["public"]["Enums"]["ai_context"]
          evaluator_scores?: Json | null
          flags?: Json | null
          geo_region?: string | null
          id?: string
          inputs_hash?: string
          inputs_schema?: Json | null
          latency_ms?: number | null
          output_schema?: Json | null
          output_summary?: string | null
          request_id?: string
          retrieved_sources?: Json
          timestamp?: string
          user_role?: string | null
        }
        Relationships: []
      }
      alternative_slot_cache: {
        Row: {
          alternative_slots: Json
          created_at: string | null
          expires_at: string | null
          id: string
          original_slot: string
          specialist_id: string
        }
        Insert: {
          alternative_slots: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          original_slot: string
          specialist_id: string
        }
        Update: {
          alternative_slots?: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          original_slot?: string
          specialist_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Json | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: Json | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      appointment_compliance_rules: {
        Row: {
          action_required: Json
          clinic_id: string | null
          condition_criteria: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          rule_name: string
          rule_type: string
        }
        Insert: {
          action_required: Json
          clinic_id?: string | null
          condition_criteria: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name: string
          rule_type: string
        }
        Update: {
          action_required?: Json
          clinic_id?: string | null
          condition_criteria?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name?: string
          rule_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_compliance_rules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_compliance_rules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_reminders: {
        Row: {
          appointment_id: string
          channel: string
          created_at: string | null
          id: string
          message_content: string | null
          recipient_contact: string
          reminder_type: string
          send_at: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          appointment_id: string
          channel: string
          created_at?: string | null
          id?: string
          message_content?: string | null
          recipient_contact: string
          reminder_type: string
          send_at: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          appointment_id?: string
          channel?: string
          created_at?: string | null
          id?: string
          message_content?: string | null
          recipient_contact?: string
          reminder_type?: string
          send_at?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_templates: {
        Row: {
          appointment_type: string
          clinic_id: string | null
          created_at: string | null
          created_by: string
          duration_minutes: number
          id: string
          is_active: boolean | null
          preparation_instructions: string | null
          required_equipment: Json | null
          required_resources: Json | null
          required_staff_roles: Json | null
          template_name: string
          updated_at: string | null
        }
        Insert: {
          appointment_type: string
          clinic_id?: string | null
          created_at?: string | null
          created_by: string
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          preparation_instructions?: string | null
          required_equipment?: Json | null
          required_resources?: Json | null
          required_staff_roles?: Json | null
          template_name: string
          updated_at?: string | null
        }
        Update: {
          appointment_type?: string
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          preparation_instructions?: string | null
          required_equipment?: Json | null
          required_resources?: Json | null
          required_staff_roles?: Json | null
          template_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_waitlist: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          notified_at: string | null
          patient_id: string
          preferred_date: string | null
          preferred_time_slot: string | null
          specialist_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          patient_id: string
          preferred_date?: string | null
          preferred_time_slot?: string | null
          specialist_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          patient_id?: string
          preferred_date?: string | null
          preferred_time_slot?: string | null
          specialist_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_waitlist_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          chief_complaint: string | null
          clinic_id: string | null
          completed_at: string | null
          confirmation_required: boolean | null
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at: string | null
          currency: string | null
          duration_minutes: number | null
          fee: number
          id: string
          location_id: string | null
          modality: string | null
          notes: string | null
          patient_confirmed: boolean | null
          patient_confirmed_at: string | null
          patient_id: string
          patient_number: string | null
          payment_id: string | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          scheduled_at: string
          specialist_confirmed: boolean | null
          specialist_confirmed_at: string | null
          specialist_id: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          symptoms: Json | null
          updated_at: string | null
          urgency_level: Database["public"]["Enums"]["urgency_level"] | null
          video_room_id: string | null
          video_room_url: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          chief_complaint?: string | null
          clinic_id?: string | null
          completed_at?: string | null
          confirmation_required?: boolean | null
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at?: string | null
          currency?: string | null
          duration_minutes?: number | null
          fee: number
          id?: string
          location_id?: string | null
          modality?: string | null
          notes?: string | null
          patient_confirmed?: boolean | null
          patient_confirmed_at?: string | null
          patient_id: string
          patient_number?: string | null
          payment_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          scheduled_at: string
          specialist_confirmed?: boolean | null
          specialist_confirmed_at?: string | null
          specialist_id: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          symptoms?: Json | null
          updated_at?: string | null
          urgency_level?: Database["public"]["Enums"]["urgency_level"] | null
          video_room_id?: string | null
          video_room_url?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          chief_complaint?: string | null
          clinic_id?: string | null
          completed_at?: string | null
          confirmation_required?: boolean | null
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string | null
          currency?: string | null
          duration_minutes?: number | null
          fee?: number
          id?: string
          location_id?: string | null
          modality?: string | null
          notes?: string | null
          patient_confirmed?: boolean | null
          patient_confirmed_at?: string | null
          patient_id?: string
          patient_number?: string | null
          payment_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          scheduled_at?: string
          specialist_confirmed?: boolean | null
          specialist_confirmed_at?: string | null
          specialist_id?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          symptoms?: Json | null
          updated_at?: string | null
          urgency_level?: Database["public"]["Enums"]["urgency_level"] | null
          video_room_id?: string | null
          video_room_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "clinic_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      autofill_suggestions: {
        Row: {
          context: string | null
          created_at: string
          field_name: string
          id: string
          suggestions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          field_name: string
          id?: string
          suggestions?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          field_name?: string
          id?: string
          suggestions?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      availability_schedules: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          specialist_id: string
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          specialist_id: string
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          specialist_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_schedules_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published_at: string | null
          reading_time_minutes: number | null
          seo_description: string | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      booking_attempts: {
        Row: {
          booked: boolean | null
          booking_id: string | null
          constraints_relaxed: Json | null
          created_at: string | null
          id: string
          patient_id: string | null
          results_count: number | null
          search_criteria: Json
          selected_specialist_id: string | null
          specialty: string
        }
        Insert: {
          booked?: boolean | null
          booking_id?: string | null
          constraints_relaxed?: Json | null
          created_at?: string | null
          id?: string
          patient_id?: string | null
          results_count?: number | null
          search_criteria: Json
          selected_specialist_id?: string | null
          specialty: string
        }
        Update: {
          booked?: boolean | null
          booking_id?: string | null
          constraints_relaxed?: Json | null
          created_at?: string | null
          id?: string
          patient_id?: string | null
          results_count?: number | null
          search_criteria?: Json
          selected_specialist_id?: string | null
          specialty?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_attempts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_conversion_metrics: {
        Row: {
          booking_completed_at: string | null
          conversion_time_seconds: number | null
          created_at: string | null
          failed_reason: string | null
          hold_created_at: string | null
          id: string
          patient_id: string | null
          search_timestamp: string | null
          slot_viewed_at: string | null
          specialist_id: string | null
        }
        Insert: {
          booking_completed_at?: string | null
          conversion_time_seconds?: number | null
          created_at?: string | null
          failed_reason?: string | null
          hold_created_at?: string | null
          id?: string
          patient_id?: string | null
          search_timestamp?: string | null
          slot_viewed_at?: string | null
          specialist_id?: string | null
        }
        Update: {
          booking_completed_at?: string | null
          conversion_time_seconds?: number | null
          created_at?: string | null
          failed_reason?: string | null
          hold_created_at?: string | null
          id?: string
          patient_id?: string | null
          search_timestamp?: string | null
          slot_viewed_at?: string | null
          specialist_id?: string | null
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          assigned_to: string | null
          browser_info: Json | null
          created_at: string | null
          description: string
          id: string
          screenshot_urls: string[] | null
          severity: string
          status: string | null
          steps_to_reproduce: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          browser_info?: Json | null
          created_at?: string | null
          description: string
          id?: string
          screenshot_urls?: string[] | null
          severity: string
          status?: string | null
          steps_to_reproduce?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          browser_info?: Json | null
          created_at?: string | null
          description?: string
          id?: string
          screenshot_urls?: string[] | null
          severity?: string
          status?: string | null
          steps_to_reproduce?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      calendar_providers: {
        Row: {
          access_token: string | null
          calendar_id: string | null
          created_at: string | null
          failure_count: number | null
          id: string
          last_refresh_attempt: string | null
          last_sync_at: string | null
          provider: string
          refresh_count: number | null
          refresh_token: string | null
          sync_enabled: boolean | null
          sync_errors: Json | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string | null
          failure_count?: number | null
          id?: string
          last_refresh_attempt?: string | null
          last_sync_at?: string | null
          provider: string
          refresh_count?: number | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          sync_errors?: Json | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string | null
          failure_count?: number | null
          id?: string
          last_refresh_attempt?: string | null
          last_sync_at?: string | null
          provider?: string
          refresh_count?: number | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          sync_errors?: Json | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_sync_logs: {
        Row: {
          action: string
          created_at: string | null
          error_message: string | null
          id: string
          provider: string
          status: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          provider: string
          status: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          provider?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      calendar_sync_tokens: {
        Row: {
          access_token: string
          calendar_id: string | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          provider: string
          refresh_token: string | null
          sync_enabled: boolean | null
          token_expiry: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          provider: string
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          provider?: string
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      capacity_metrics: {
        Row: {
          appointment_count: number | null
          clinic_id: string | null
          created_at: string | null
          date: string
          id: string
          location_id: string | null
          resource_id: string | null
          resource_type: string
          total_capacity_minutes: number
          utilization_percentage: number | null
          utilized_minutes: number | null
        }
        Insert: {
          appointment_count?: number | null
          clinic_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          location_id?: string | null
          resource_id?: string | null
          resource_type: string
          total_capacity_minutes: number
          utilization_percentage?: number | null
          utilized_minutes?: number | null
        }
        Update: {
          appointment_count?: number | null
          clinic_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          location_id?: string | null
          resource_id?: string | null
          resource_type?: string
          total_capacity_minutes?: number
          utilization_percentage?: number | null
          utilized_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "capacity_metrics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capacity_metrics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capacity_metrics_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "clinic_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      care_pathways: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          duration_days: number | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          name: string
          pathway_type: string
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          duration_days?: number | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name: string
          pathway_type: string
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name?: string
          pathway_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_pathways_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_pathways_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      care_plan_tasks: {
        Row: {
          assigned_to: string | null
          care_plan_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          milestone: boolean | null
          sequence_order: number | null
          status: string | null
          task_name: string
          task_type: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          care_plan_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          milestone?: boolean | null
          sequence_order?: number | null
          status?: string | null
          task_name: string
          task_type: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          care_plan_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          milestone?: boolean | null
          sequence_order?: number | null
          status?: string | null
          task_name?: string
          task_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_plan_tasks_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "patient_care_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      care_team_members: {
        Row: {
          id: string
          joined_at: string | null
          permissions: Json | null
          role: string
          specialist_id: string | null
          team_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          permissions?: Json | null
          role: string
          specialist_id?: string | null
          team_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          specialist_id?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_team_members_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "care_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      care_teams: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          team_type: string | null
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          team_type?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          team_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_teams_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_teams_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_sessions: {
        Row: {
          created_at: string | null
          escalated: boolean | null
          escalated_at: string | null
          id: string
          messages: Json | null
          resolved: boolean | null
          resolved_at: string | null
          session_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          escalated?: boolean | null
          escalated_at?: string | null
          id?: string
          messages?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          session_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          escalated?: boolean | null
          escalated_at?: string | null
          id?: string
          messages?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          session_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clinic_integrations: {
        Row: {
          access_token: string | null
          clinic_id: string
          created_at: string | null
          id: string
          integration_type: string
          is_active: boolean | null
          profile_data: Json | null
          profile_id: string | null
          refresh_token: string | null
          settings: Json | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          clinic_id: string
          created_at?: string | null
          id?: string
          integration_type: string
          is_active?: boolean | null
          profile_data?: Json | null
          profile_id?: string | null
          refresh_token?: string | null
          settings?: Json | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          clinic_id?: string
          created_at?: string | null
          id?: string
          integration_type?: string
          is_active?: boolean | null
          profile_data?: Json | null
          profile_id?: string | null
          refresh_token?: string | null
          settings?: Json | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_integrations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_integrations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_invitations: {
        Row: {
          accepted_at: string | null
          clinic_id: string
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          role: string
          status: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          clinic_id: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          role?: string
          status?: string | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          clinic_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          role?: string
          status?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_invitations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_invitations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_locations: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          clinic_id: string
          country: string
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          latitude: number | null
          location_name: string
          longitude: number | null
          operating_hours: Json | null
          phone: string | null
          postal_code: string | null
          services_offered: string[] | null
          staff_ids: string[] | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          clinic_id: string
          country: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          latitude?: number | null
          location_name: string
          longitude?: number | null
          operating_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          services_offered?: string[] | null
          staff_ids?: string[] | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          clinic_id?: string
          country?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          latitude?: number | null
          location_name?: string
          longitude?: number | null
          operating_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          services_offered?: string[] | null
          staff_ids?: string[] | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_locations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_locations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_photos: {
        Row: {
          caption: string | null
          category: string | null
          clinic_id: string
          created_at: string | null
          display_order: number | null
          id: string
          photo_url: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          category?: string | null
          clinic_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          photo_url: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          category?: string | null
          clinic_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          photo_url?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_photos_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_photos_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_resources: {
        Row: {
          capacity: number | null
          clinic_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          location_id: string | null
          properties: Json | null
          resource_name: string
          resource_type: string
        }
        Insert: {
          capacity?: number | null
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          properties?: Json | null
          resource_name: string
          resource_type: string
        }
        Update: {
          capacity?: number | null
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          properties?: Json | null
          resource_name?: string
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_resources_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_resources_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_resources_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "clinic_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_staff: {
        Row: {
          clinic_id: string
          id: string
          is_active: boolean | null
          joined_at: string | null
          permissions: Json | null
          role: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          role: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_staff_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_staff_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          accessibility_features: string[] | null
          address_line1: string | null
          address_line2: string | null
          after_hours_available: boolean | null
          booking_policies: Json | null
          brand_color: string | null
          brand_secondary_color: string | null
          cancellation_policy: string | null
          certifications: string[] | null
          city: string | null
          clinic_type: Database["public"]["Enums"]["clinic_type"]
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          email: string | null
          emergency_services: boolean | null
          equipment_available: string[] | null
          header_image_url: string | null
          id: string
          insurance_accepted: string[] | null
          intro_video_url: string | null
          is_active: boolean | null
          languages_supported: string[] | null
          latitude: number | null
          license_number: string | null
          logo_url: string | null
          longitude: number | null
          mission_statement: string | null
          name: string
          operating_hours: Json | null
          parking_info: string | null
          phone: string | null
          postal_code: string | null
          services_offered: string[] | null
          specialties: string[] | null
          state: string | null
          stripe_customer_id: string | null
          subscription_expires_at: string | null
          subscription_tier: string | null
          tagline: string | null
          tax_id: string | null
          updated_at: string | null
          video_url: string | null
          website: string | null
        }
        Insert: {
          accessibility_features?: string[] | null
          address_line1?: string | null
          address_line2?: string | null
          after_hours_available?: boolean | null
          booking_policies?: Json | null
          brand_color?: string | null
          brand_secondary_color?: string | null
          cancellation_policy?: string | null
          certifications?: string[] | null
          city?: string | null
          clinic_type: Database["public"]["Enums"]["clinic_type"]
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          email?: string | null
          emergency_services?: boolean | null
          equipment_available?: string[] | null
          header_image_url?: string | null
          id?: string
          insurance_accepted?: string[] | null
          intro_video_url?: string | null
          is_active?: boolean | null
          languages_supported?: string[] | null
          latitude?: number | null
          license_number?: string | null
          logo_url?: string | null
          longitude?: number | null
          mission_statement?: string | null
          name: string
          operating_hours?: Json | null
          parking_info?: string | null
          phone?: string | null
          postal_code?: string | null
          services_offered?: string[] | null
          specialties?: string[] | null
          state?: string | null
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          tagline?: string | null
          tax_id?: string | null
          updated_at?: string | null
          video_url?: string | null
          website?: string | null
        }
        Update: {
          accessibility_features?: string[] | null
          address_line1?: string | null
          address_line2?: string | null
          after_hours_available?: boolean | null
          booking_policies?: Json | null
          brand_color?: string | null
          brand_secondary_color?: string | null
          cancellation_policy?: string | null
          certifications?: string[] | null
          city?: string | null
          clinic_type?: Database["public"]["Enums"]["clinic_type"]
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          email?: string | null
          emergency_services?: boolean | null
          equipment_available?: string[] | null
          header_image_url?: string | null
          id?: string
          insurance_accepted?: string[] | null
          intro_video_url?: string | null
          is_active?: boolean | null
          languages_supported?: string[] | null
          latitude?: number | null
          license_number?: string | null
          logo_url?: string | null
          longitude?: number | null
          mission_statement?: string | null
          name?: string
          operating_hours?: Json | null
          parking_info?: string | null
          phone?: string | null
          postal_code?: string | null
          services_offered?: string[] | null
          specialties?: string[] | null
          state?: string | null
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          tagline?: string | null
          tax_id?: string | null
          updated_at?: string | null
          video_url?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_answers: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_accepted: boolean | null
          is_verified: boolean | null
          question_id: string
          updated_at: string | null
          upvote_count: number | null
          verified_by: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_accepted?: boolean | null
          is_verified?: boolean | null
          question_id: string
          updated_at?: string | null
          upvote_count?: number | null
          verified_by?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_accepted?: boolean | null
          is_verified?: boolean | null
          question_id?: string
          updated_at?: string | null
          upvote_count?: number | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "community_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_questions: {
        Row: {
          answer_count: number | null
          author_id: string
          category: string | null
          content: string
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          upvote_count: number | null
          view_count: number | null
        }
        Insert: {
          answer_count?: number | null
          author_id: string
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          upvote_count?: number | null
          view_count?: number | null
        }
        Update: {
          answer_count?: number | null
          author_id?: string
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          upvote_count?: number | null
          view_count?: number | null
        }
        Relationships: []
      }
      complaint_messages: {
        Row: {
          attachments: Json | null
          complaint_id: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          message: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          attachments?: Json | null
          complaint_id: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message: string
          sender_id: string
          sender_type: string
        }
        Update: {
          attachments?: Json | null
          complaint_id?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_messages_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          against_type: string
          assigned_mediator: string | null
          board_case_number: string | null
          complaint_type: string
          created_at: string | null
          description: string
          escalated_to_board: boolean | null
          evidence_urls: Json | null
          filed_against: string
          filed_by: string
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          ticket_number: string
          title: string
          updated_at: string | null
        }
        Insert: {
          against_type: string
          assigned_mediator?: string | null
          board_case_number?: string | null
          complaint_type: string
          created_at?: string | null
          description: string
          escalated_to_board?: boolean | null
          evidence_urls?: Json | null
          filed_against: string
          filed_by: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          ticket_number?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          against_type?: string
          assigned_mediator?: string | null
          board_case_number?: string | null
          complaint_type?: string
          created_at?: string | null
          description?: string
          escalated_to_board?: boolean | null
          evidence_urls?: Json | null
          filed_against?: string
          filed_by?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          ticket_number?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      conditions_catalog: {
        Row: {
          category: string
          condition_name: string
          created_at: string | null
          id: string
          specialty_tags: string[] | null
        }
        Insert: {
          category: string
          condition_name: string
          created_at?: string | null
          id?: string
          specialty_tags?: string[] | null
        }
        Update: {
          category?: string
          condition_name?: string
          created_at?: string | null
          id?: string
          specialty_tags?: string[] | null
        }
        Relationships: []
      }
      connector_configurations: {
        Row: {
          clinic_id: string | null
          config: Json
          connector_name: string
          connector_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          scopes: string[]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          clinic_id?: string | null
          config?: Json
          connector_name: string
          connector_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          scopes?: string[]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          clinic_id?: string | null
          config?: Json
          connector_name?: string
          connector_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          scopes?: string[]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connector_configurations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connector_configurations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_consents: {
        Row: {
          connector_id: string
          data_types: string[]
          expires_at: string | null
          granted: boolean
          granted_at: string | null
          id: string
          purpose: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          connector_id: string
          data_types: string[]
          expires_at?: string | null
          granted: boolean
          granted_at?: string | null
          id?: string
          purpose: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          connector_id?: string
          data_types?: string[]
          expires_at?: string | null
          granted?: boolean
          granted_at?: string | null
          id?: string
          purpose?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connector_consents_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connector_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_sync_logs: {
        Row: {
          connector_id: string
          created_at: string | null
          error_message: string | null
          id: string
          records_synced: number | null
          status: string
          sync_completed_at: string | null
          sync_started_at: string | null
          sync_type: string
        }
        Insert: {
          connector_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          status: string
          sync_completed_at?: string | null
          sync_started_at?: string | null
          sync_type: string
        }
        Update: {
          connector_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          status?: string
          sync_completed_at?: string | null
          sync_started_at?: string | null
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "connector_sync_logs_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connector_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consent_text: string
          consent_type: string
          granted: boolean
          granted_at: string | null
          id: string
          ip_address: string | null
          revoked_at: string | null
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          consent_text: string
          consent_type: string
          granted: boolean
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
          version: string
        }
        Update: {
          consent_text?: string
          consent_type?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_drafts: {
        Row: {
          ai_metadata: Json | null
          content: string | null
          created_at: string | null
          id: string
          length: string | null
          title: string | null
          tone: string | null
          topic: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_metadata?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string
          length?: string | null
          title?: string | null
          tone?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_metadata?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string
          length?: string | null
          title?: string | null
          tone?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          messages: Json | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          messages?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          messages?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cost_estimate_locks: {
        Row: {
          created_at: string | null
          currency: string
          estimate_id: string
          expires_at: string
          id: string
          is_active: boolean | null
          locked_price: number
          patient_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string
          estimate_id: string
          expires_at: string
          id?: string
          is_active?: boolean | null
          locked_price: number
          patient_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string
          estimate_id?: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
          locked_price?: number
          patient_id?: string
        }
        Relationships: []
      }
      cost_estimates: {
        Row: {
          appointment_id: string | null
          copay: number | null
          created_at: string | null
          deductible_applied: number | null
          estimate_details: Json | null
          estimated_insurance_payment: number | null
          estimated_patient_responsibility: number | null
          estimated_total: number
          id: string
          insurance_plan: string | null
          patient_id: string | null
          service_codes: string[]
        }
        Insert: {
          appointment_id?: string | null
          copay?: number | null
          created_at?: string | null
          deductible_applied?: number | null
          estimate_details?: Json | null
          estimated_insurance_payment?: number | null
          estimated_patient_responsibility?: number | null
          estimated_total: number
          id?: string
          insurance_plan?: string | null
          patient_id?: string | null
          service_codes: string[]
        }
        Update: {
          appointment_id?: string | null
          copay?: number | null
          created_at?: string | null
          deductible_applied?: number | null
          estimate_details?: Json | null
          estimated_insurance_payment?: number | null
          estimated_patient_responsibility?: number | null
          estimated_total?: number
          id?: string
          insurance_plan?: string | null
          patient_id?: string | null
          service_codes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "cost_estimates_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_verifications: {
        Row: {
          audit_trail: Json | null
          created_at: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          specialist_id: string
          verification_date: string | null
          verification_document_url: string | null
          verification_type: string
          verified_by: string
        }
        Insert: {
          audit_trail?: Json | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          specialist_id: string
          verification_date?: string | null
          verification_document_url?: string | null
          verification_type: string
          verified_by: string
        }
        Update: {
          audit_trail?: Json | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          specialist_id?: string
          verification_date?: string | null
          verification_document_url?: string | null
          verification_type?: string
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_verifications_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      data_portability_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          data_format: string | null
          destination_system: string | null
          export_url: string | null
          id: string
          include_appointments: boolean | null
          include_medical_records: boolean | null
          include_prescriptions: boolean | null
          metadata: Json | null
          request_type: string
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          data_format?: string | null
          destination_system?: string | null
          export_url?: string | null
          id?: string
          include_appointments?: boolean | null
          include_medical_records?: boolean | null
          include_prescriptions?: boolean | null
          metadata?: Json | null
          request_type: string
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          data_format?: string | null
          destination_system?: string | null
          export_url?: string | null
          id?: string
          include_appointments?: boolean | null
          include_medical_records?: boolean | null
          include_prescriptions?: boolean | null
          metadata?: Json | null
          request_type?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      delivery_confirmations: {
        Row: {
          confirmation_type: string
          confirmed_by: string
          created_at: string | null
          id: string
          message_delivery_id: string
          notes: string | null
        }
        Insert: {
          confirmation_type: string
          confirmed_by: string
          created_at?: string | null
          id?: string
          message_delivery_id: string
          notes?: string | null
        }
        Update: {
          confirmation_type?: string
          confirmed_by?: string
          created_at?: string | null
          id?: string
          message_delivery_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_confirmations_message_delivery_id_fkey"
            columns: ["message_delivery_id"]
            isOneToOne: false
            referencedRelation: "message_deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_logs: {
        Row: {
          access_type: string
          accessed_at: string | null
          accessed_by: string
          document_id: string
          id: string
          ip_address: string | null
          share_id: string | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          accessed_by: string
          document_id: string
          id?: string
          ip_address?: string | null
          share_id?: string | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          accessed_by?: string
          document_id?: string
          id?: string
          ip_address?: string | null
          share_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_access_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_logs_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "document_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      document_shares: {
        Row: {
          access_count: number | null
          consent_given: boolean
          consent_given_at: string | null
          created_at: string | null
          document_id: string
          expires_at: string
          id: string
          last_accessed_at: string | null
          purpose: string
          revoked_at: string | null
          revoked_by: string | null
          shared_by: string
          shared_with: string
          updated_at: string | null
        }
        Insert: {
          access_count?: number | null
          consent_given?: boolean
          consent_given_at?: string | null
          created_at?: string | null
          document_id: string
          expires_at: string
          id?: string
          last_accessed_at?: string | null
          purpose: string
          revoked_at?: string | null
          revoked_by?: string | null
          shared_by: string
          shared_with: string
          updated_at?: string | null
        }
        Update: {
          access_count?: number | null
          consent_given?: boolean
          consent_given_at?: string | null
          created_at?: string | null
          document_id?: string
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          purpose?: string
          revoked_at?: string | null
          revoked_by?: string | null
          shared_by?: string
          shared_with?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signatures: {
        Row: {
          created_at: string | null
          document_id: string
          document_type: string
          docusign_envelope_id: string | null
          id: string
          signed_at: string | null
          signer_id: string
          signing_url: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          document_type: string
          docusign_envelope_id?: string | null
          id?: string
          signed_at?: string | null
          signer_id: string
          signing_url?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          document_type?: string
          docusign_envelope_id?: string | null
          id?: string
          signed_at?: string | null
          signer_id?: string
          signing_url?: string | null
          status?: string | null
        }
        Relationships: []
      }
      ehds_compliance_logs: {
        Row: {
          access_purpose: string | null
          action_type: string
          created_at: string | null
          granted: boolean | null
          id: string
          ip_address: string | null
          legal_basis: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_purpose?: string | null
          action_type: string
          created_at?: string | null
          granted?: boolean | null
          id?: string
          ip_address?: string | null
          legal_basis?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_purpose?: string | null
          action_type?: string
          created_at?: string | null
          granted?: boolean | null
          id?: string
          ip_address?: string | null
          legal_basis?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ehds_compliance_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ehds_consents: {
        Row: {
          consent_document_url: string | null
          consent_type: string
          created_at: string | null
          ehds_compliant: boolean | null
          granted: boolean
          granted_at: string | null
          id: string
          jurisdiction: string
          legal_basis: string | null
          metadata: Json | null
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          consent_document_url?: string | null
          consent_type: string
          created_at?: string | null
          ehds_compliant?: boolean | null
          granted: boolean
          granted_at?: string | null
          id?: string
          jurisdiction: string
          legal_basis?: string | null
          metadata?: Json | null
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          consent_document_url?: string | null
          consent_type?: string
          created_at?: string | null
          ehds_compliant?: boolean | null
          granted?: boolean
          granted_at?: string | null
          id?: string
          jurisdiction?: string
          legal_basis?: string | null
          metadata?: Json | null
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      eligibility_checks: {
        Row: {
          check_date: string | null
          copay_amount: number | null
          coverage_details: Json | null
          created_at: string | null
          deductible_remaining: number | null
          id: string
          is_eligible: boolean | null
          member_id: string
          out_of_pocket_remaining: number | null
          patient_id: string
          payer_id: string
          plan_details: Json | null
        }
        Insert: {
          check_date?: string | null
          copay_amount?: number | null
          coverage_details?: Json | null
          created_at?: string | null
          deductible_remaining?: number | null
          id?: string
          is_eligible?: boolean | null
          member_id: string
          out_of_pocket_remaining?: number | null
          patient_id: string
          payer_id: string
          plan_details?: Json | null
        }
        Update: {
          check_date?: string | null
          copay_amount?: number | null
          coverage_details?: Json | null
          created_at?: string | null
          deductible_remaining?: number | null
          id?: string
          is_eligible?: boolean | null
          member_id?: string
          out_of_pocket_remaining?: number | null
          patient_id?: string
          payer_id?: string
          plan_details?: Json | null
        }
        Relationships: []
      }
      emergency_incidents: {
        Row: {
          created_at: string | null
          description: string
          escalation_level: number | null
          id: string
          incident_type: string
          initiated_by: string
          notifications_sent: Json | null
          patient_id: string | null
          protocol_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          escalation_level?: number | null
          id?: string
          incident_type: string
          initiated_by: string
          notifications_sent?: Json | null
          patient_id?: string | null
          protocol_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          escalation_level?: number | null
          id?: string
          incident_type?: string
          initiated_by?: string
          notifications_sent?: Json | null
          patient_id?: string | null
          protocol_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_incidents_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "emergency_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_protocols: {
        Row: {
          clinic_id: string | null
          contact_list: Json
          created_at: string | null
          escalation_steps: Json
          id: string
          is_active: boolean | null
          protocol_name: string
          protocol_type: string
          trigger_conditions: Json
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          contact_list: Json
          created_at?: string | null
          escalation_steps: Json
          id?: string
          is_active?: boolean | null
          protocol_name: string
          protocol_type: string
          trigger_conditions: Json
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          contact_list?: Json
          created_at?: string | null
          escalation_steps?: Json
          id?: string
          is_active?: boolean | null
          protocol_name?: string
          protocol_type?: string
          trigger_conditions?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_protocols_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_protocols_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_analytics: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          patient_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          patient_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          patient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "engagement_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_campaigns: {
        Row: {
          analytics: Json | null
          campaign_name: string
          campaign_type: string
          channels: string[]
          clinic_id: string | null
          created_at: string | null
          created_by: string
          id: string
          message_template: string
          schedule: Json
          status: string
          target_audience: Json
          updated_at: string | null
        }
        Insert: {
          analytics?: Json | null
          campaign_name: string
          campaign_type: string
          channels?: string[]
          clinic_id?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          message_template: string
          schedule?: Json
          status?: string
          target_audience?: Json
          updated_at?: string | null
        }
        Update: {
          analytics?: Json | null
          campaign_name?: string
          campaign_type?: string
          channels?: string[]
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          message_template?: string
          schedule?: Json
          status?: string
          target_audience?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_campaigns_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_campaigns_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_tasks: {
        Row: {
          assigned_by: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          patient_id: string
          reminder_sent: boolean | null
          task_type: string
          title: string
        }
        Insert: {
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          patient_id: string
          reminder_sent?: boolean | null
          task_type: string
          title: string
        }
        Update: {
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          patient_id?: string
          reminder_sent?: boolean | null
          task_type?: string
          title?: string
        }
        Relationships: []
      }
      evening_load_metrics: {
        Row: {
          after_hours_minutes: number | null
          charts_reviewed: number | null
          clinic_id: string | null
          created_at: string | null
          documentation_time_minutes: number | null
          id: string
          inbox_half_life_hours: number | null
          inbox_time_minutes: number | null
          items_closed: number | null
          items_deferred: number | null
          messages_handled: number | null
          metric_date: string
          orders_placed: number | null
          user_id: string
        }
        Insert: {
          after_hours_minutes?: number | null
          charts_reviewed?: number | null
          clinic_id?: string | null
          created_at?: string | null
          documentation_time_minutes?: number | null
          id?: string
          inbox_half_life_hours?: number | null
          inbox_time_minutes?: number | null
          items_closed?: number | null
          items_deferred?: number | null
          messages_handled?: number | null
          metric_date: string
          orders_placed?: number | null
          user_id: string
        }
        Update: {
          after_hours_minutes?: number | null
          charts_reviewed?: number | null
          clinic_id?: string | null
          created_at?: string | null
          documentation_time_minutes?: number | null
          id?: string
          inbox_half_life_hours?: number | null
          inbox_time_minutes?: number | null
          items_closed?: number | null
          items_deferred?: number | null
          messages_handled?: number | null
          metric_date?: string
          orders_placed?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evening_load_metrics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evening_load_metrics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      exports: {
        Row: {
          completed_at: string | null
          created_at: string
          export_type: string
          file_url: string | null
          id: string
          metadata: Json | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          export_type: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          export_type?: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string | null
          date_of_birth: string
          first_name: string
          gender: string | null
          has_proxy_access: boolean | null
          id: string
          last_name: string
          primary_user_id: string
          relationship: string
        }
        Insert: {
          created_at?: string | null
          date_of_birth: string
          first_name: string
          gender?: string | null
          has_proxy_access?: boolean | null
          id?: string
          last_name: string
          primary_user_id: string
          relationship: string
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string
          first_name?: string
          gender?: string | null
          has_proxy_access?: boolean | null
          id?: string
          last_name?: string
          primary_user_id?: string
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_primary_user_id_fkey"
            columns: ["primary_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          patient_id: string
          specialist_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          patient_id: string
          specialist_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          patient_id?: string
          specialist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean | null
          flag_name: string
          id: string
          rollout_percentage: number | null
          target_roles: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          flag_name: string
          id?: string
          rollout_percentage?: number | null
          target_roles?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          flag_name?: string
          id?: string
          rollout_percentage?: number | null
          target_roles?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          payment_id: string | null
          transaction_date: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          transaction_date?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          transaction_date?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_mode_preferences: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          favorite_panels: Json | null
          hidden_panels: Json | null
          id: string
          keyboard_shortcuts: Json | null
          panel_order: Json | null
          quick_actions: Json | null
          show_active_medications: boolean | null
          show_allergies: boolean | null
          show_billing_info: boolean | null
          show_problem_list: boolean | null
          show_recent_labs: boolean | null
          show_vitals_summary: boolean | null
          updated_at: string | null
          user_id: string
          user_role: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          favorite_panels?: Json | null
          hidden_panels?: Json | null
          id?: string
          keyboard_shortcuts?: Json | null
          panel_order?: Json | null
          quick_actions?: Json | null
          show_active_medications?: boolean | null
          show_allergies?: boolean | null
          show_billing_info?: boolean | null
          show_problem_list?: boolean | null
          show_recent_labs?: boolean | null
          show_vitals_summary?: boolean | null
          updated_at?: string | null
          user_id: string
          user_role: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          favorite_panels?: Json | null
          hidden_panels?: Json | null
          id?: string
          keyboard_shortcuts?: Json | null
          panel_order?: Json | null
          quick_actions?: Json | null
          show_active_medications?: boolean | null
          show_allergies?: boolean | null
          show_billing_info?: boolean | null
          show_problem_list?: boolean | null
          show_recent_labs?: boolean | null
          show_vitals_summary?: boolean | null
          updated_at?: string | null
          user_id?: string
          user_role?: string
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          active_panels: Json | null
          appointment_id: string | null
          click_count: number | null
          created_at: string | null
          ended_at: string | null
          focus_enabled: boolean | null
          hidden_elements: Json | null
          id: string
          navigation_events: Json | null
          session_type: string | null
          started_at: string | null
          time_in_session_seconds: number | null
          user_id: string
        }
        Insert: {
          active_panels?: Json | null
          appointment_id?: string | null
          click_count?: number | null
          created_at?: string | null
          ended_at?: string | null
          focus_enabled?: boolean | null
          hidden_elements?: Json | null
          id?: string
          navigation_events?: Json | null
          session_type?: string | null
          started_at?: string | null
          time_in_session_seconds?: number | null
          user_id: string
        }
        Update: {
          active_panels?: Json | null
          appointment_id?: string | null
          click_count?: number | null
          created_at?: string | null
          ended_at?: string | null
          focus_enabled?: boolean | null
          hidden_elements?: Json | null
          id?: string
          navigation_events?: Json | null
          session_type?: string | null
          started_at?: string | null
          time_in_session_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      form_autosaves: {
        Row: {
          created_at: string | null
          form_data: Json
          form_type: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          form_data: Json
          form_type: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          form_data?: Json
          form_type?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          specialty_tags: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          specialty_tags?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          specialty_tags?: string[] | null
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          author_id: string
          category_id: string
          content: string
          created_at: string | null
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id: string
          category_id: string
          content: string
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string
          category_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_solution: boolean | null
          post_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_solution?: boolean | null
          post_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_solution?: boolean | null
          post_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_votes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          reply_id: string | null
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reply_id?: string | null
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reply_id?: string | null
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_votes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      group_appointment_slots: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          duration_minutes: number
          id: string
          is_available: boolean | null
          required_specialists: string[]
          room_id: string | null
          slot_datetime: string
          slot_type: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          duration_minutes: number
          id?: string
          is_available?: boolean | null
          required_specialists: string[]
          room_id?: string | null
          slot_datetime: string
          slot_type?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          is_available?: boolean | null
          required_specialists?: string[]
          room_id?: string | null
          slot_datetime?: string
          slot_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_appointment_slots_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_appointment_slots_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      group_booking_sessions: {
        Row: {
          confirmed_slots: Json | null
          created_at: string | null
          duration_minutes: number
          id: string
          organizer_id: string
          preferred_date: string
          specialist_ids: string[]
          status: string
          updated_at: string | null
        }
        Insert: {
          confirmed_slots?: Json | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          organizer_id: string
          preferred_date: string
          specialist_ids: string[]
          status?: string
          updated_at?: string | null
        }
        Update: {
          confirmed_slots?: Json | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          organizer_id?: string
          preferred_date?: string
          specialist_ids?: string[]
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      import_comparison: {
        Row: {
          applied: boolean | null
          applied_at: string | null
          applied_by: string | null
          clinic_id: string
          created_at: string | null
          current_data: Json
          id: string
          imported_data: Json
          source: string
        }
        Insert: {
          applied?: boolean | null
          applied_at?: string | null
          applied_by?: string | null
          clinic_id: string
          created_at?: string | null
          current_data: Json
          id?: string
          imported_data: Json
          source: string
        }
        Update: {
          applied?: boolean | null
          applied_at?: string | null
          applied_by?: string | null
          clinic_id?: string
          created_at?: string | null
          current_data?: Json
          id?: string
          imported_data?: Json
          source?: string
        }
        Relationships: []
      }
      insurance_claims: {
        Row: {
          adjudication_date: string | null
          allowed_amount: number | null
          appointment_id: string | null
          billed_amount: number
          claim_data: Json | null
          claim_number: string
          created_at: string | null
          denial_reason: string | null
          diagnosis_codes: string[]
          id: string
          paid_amount: number | null
          patient_id: string
          payer_id: string
          payer_name: string
          procedure_codes: string[]
          service_date: string
          specialist_id: string
          status: string | null
          submission_date: string | null
          updated_at: string | null
        }
        Insert: {
          adjudication_date?: string | null
          allowed_amount?: number | null
          appointment_id?: string | null
          billed_amount: number
          claim_data?: Json | null
          claim_number?: string
          created_at?: string | null
          denial_reason?: string | null
          diagnosis_codes: string[]
          id?: string
          paid_amount?: number | null
          patient_id: string
          payer_id: string
          payer_name: string
          procedure_codes: string[]
          service_date: string
          specialist_id: string
          status?: string | null
          submission_date?: string | null
          updated_at?: string | null
        }
        Update: {
          adjudication_date?: string | null
          allowed_amount?: number | null
          appointment_id?: string | null
          billed_amount?: number
          claim_data?: Json | null
          claim_number?: string
          created_at?: string | null
          denial_reason?: string | null
          diagnosis_codes?: string[]
          id?: string
          paid_amount?: number | null
          patient_id?: string
          payer_id?: string
          payer_name?: string
          procedure_codes?: string[]
          service_date?: string
          specialist_id?: string
          status?: string | null
          submission_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_networks: {
        Row: {
          country: string
          created_at: string | null
          id: string
          network_name: string
          provider_type: string | null
        }
        Insert: {
          country: string
          created_at?: string | null
          id?: string
          network_name: string
          provider_type?: string | null
        }
        Update: {
          country?: string
          created_at?: string | null
          id?: string
          network_name?: string
          provider_type?: string | null
        }
        Relationships: []
      }
      insurance_verifications: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          insurance_network: string
          insurance_provider: string
          last_checked: string | null
          notes: string | null
          specialist_id: string | null
          verification_source: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          insurance_network: string
          insurance_provider: string
          last_checked?: string | null
          notes?: string | null
          specialist_id?: string | null
          verification_source?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          insurance_network?: string
          insurance_provider?: string
          last_checked?: string | null
          notes?: string | null
          specialist_id?: string | null
          verification_source?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_verifications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_verifications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_verifications_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_configs: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          credentials: Json | null
          id: string
          integration_type: string
          is_active: boolean | null
          last_sync_at: string | null
          settings: Json | null
          sync_error: string | null
          sync_status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          integration_type: string
          is_active?: boolean | null
          last_sync_at?: string | null
          settings?: Json | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          integration_type?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          settings?: Json | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_configs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_configs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          appointment_id: string
          clinic_id: string | null
          created_at: string | null
          currency: string
          due_date: string | null
          id: string
          invoice_number: string
          line_items: Json
          paid_at: string | null
          patient_id: string
          specialist_id: string
          status: string
          subtotal: number
          tax: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          appointment_id: string
          clinic_id?: string | null
          created_at?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          line_items?: Json
          paid_at?: string | null
          patient_id: string
          specialist_id: string
          status?: string
          subtotal: number
          tax?: number | null
          total: number
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string
          clinic_id?: string | null
          created_at?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          line_items?: Json
          paid_at?: string | null
          patient_id?: string
          specialist_id?: string
          status?: string
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          application_count: number | null
          clinic_id: string | null
          created_at: string | null
          description: string
          employment_type: string | null
          experience_level: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          location_id: string | null
          posted_by: string
          salary_range_max: number | null
          salary_range_min: number | null
          specialty_required: string[] | null
          title: string
        }
        Insert: {
          application_count?: number | null
          clinic_id?: string | null
          created_at?: string | null
          description: string
          employment_type?: string | null
          experience_level?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          posted_by: string
          salary_range_max?: number | null
          salary_range_min?: number | null
          specialty_required?: string[] | null
          title: string
        }
        Update: {
          application_count?: number | null
          clinic_id?: string | null
          created_at?: string | null
          description?: string
          employment_type?: string | null
          experience_level?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          posted_by?: string
          salary_range_max?: number | null
          salary_range_min?: number | null
          specialty_required?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "clinic_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_orders: {
        Row: {
          appointment_id: string | null
          clinical_notes: string | null
          collected_at: string | null
          created_at: string | null
          dicom_urls: string[] | null
          id: string
          lab_facility: string | null
          order_number: string | null
          order_type: string
          ordered_at: string | null
          patient_id: string
          patient_number: string | null
          priority: string | null
          result_data: Json | null
          result_pdf_url: string | null
          resulted_at: string | null
          specialist_id: string
          status: string | null
          test_codes: string[]
          test_names: string[]
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          clinical_notes?: string | null
          collected_at?: string | null
          created_at?: string | null
          dicom_urls?: string[] | null
          id?: string
          lab_facility?: string | null
          order_number?: string | null
          order_type: string
          ordered_at?: string | null
          patient_id: string
          patient_number?: string | null
          priority?: string | null
          result_data?: Json | null
          result_pdf_url?: string | null
          resulted_at?: string | null
          specialist_id: string
          status?: string | null
          test_codes: string[]
          test_names: string[]
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          clinical_notes?: string | null
          collected_at?: string | null
          created_at?: string | null
          dicom_urls?: string[] | null
          id?: string
          lab_facility?: string | null
          order_number?: string | null
          order_type?: string
          ordered_at?: string | null
          patient_id?: string
          patient_number?: string | null
          priority?: string | null
          result_data?: Json | null
          result_pdf_url?: string | null
          resulted_at?: string | null
          specialist_id?: string
          status?: string | null
          test_codes?: string[]
          test_names?: string[]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_orders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_archives: {
        Row: {
          archive_hash: string
          archive_type: string
          archived_by: string | null
          archived_data: Json
          case_number: string | null
          complaint_id: string | null
          created_at: string | null
          id: string
          legal_hold: boolean | null
        }
        Insert: {
          archive_hash: string
          archive_type: string
          archived_by?: string | null
          archived_data: Json
          case_number?: string | null
          complaint_id?: string | null
          created_at?: string | null
          id?: string
          legal_hold?: boolean | null
        }
        Update: {
          archive_hash?: string
          archive_type?: string
          archived_by?: string | null
          archived_data?: Json
          case_number?: string | null
          complaint_id?: string | null
          created_at?: string | null
          id?: string
          legal_hold?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_archives_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      mediation_messages: {
        Row: {
          attachments: Json | null
          created_at: string | null
          dispute_id: string
          id: string
          is_private: boolean | null
          message: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          dispute_id: string
          id?: string
          is_private?: boolean | null
          message: string
          sender_id: string
          sender_role: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          dispute_id?: string
          id?: string
          is_private?: boolean | null
          message?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "mediation_messages_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "review_disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_codes: {
        Row: {
          category: string | null
          code: string
          code_system: string
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          metadata: Json | null
        }
        Insert: {
          category?: string | null
          code: string
          code_system: string
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          category?: string | null
          code?: string
          code_system?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          description: string | null
          fhir_data: Json | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_fhir_compliant: boolean | null
          metadata: Json | null
          patient_id: string
          patient_number: string | null
          record_type: string
          recorded_at: string | null
          specialist_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          description?: string | null
          fhir_data?: Json | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_fhir_compliant?: boolean | null
          metadata?: Json | null
          patient_id: string
          patient_number?: string | null
          record_type: string
          recorded_at?: string | null
          specialist_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          description?: string | null
          fhir_data?: Json | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_fhir_compliant?: boolean | null
          metadata?: Json | null
          patient_id?: string
          patient_number?: string | null
          record_type?: string
          recorded_at?: string | null
          specialist_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      medicare_medicaid_claims: {
        Row: {
          appointment_id: string | null
          billing_provider: string | null
          claim_number: string | null
          claim_type: string
          clinic_id: string | null
          created_at: string | null
          denial_reason: string | null
          diagnosis_codes: Json | null
          id: string
          medicare_paid: number | null
          patient_id: string
          patient_responsibility: number | null
          procedure_codes: Json | null
          processed_date: string | null
          rendering_provider: string | null
          service_date: string
          status: string | null
          submission_date: string | null
          total_charge: number | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          billing_provider?: string | null
          claim_number?: string | null
          claim_type: string
          clinic_id?: string | null
          created_at?: string | null
          denial_reason?: string | null
          diagnosis_codes?: Json | null
          id?: string
          medicare_paid?: number | null
          patient_id: string
          patient_responsibility?: number | null
          procedure_codes?: Json | null
          processed_date?: string | null
          rendering_provider?: string | null
          service_date: string
          status?: string | null
          submission_date?: string | null
          total_charge?: number | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          billing_provider?: string | null
          claim_number?: string | null
          claim_type?: string
          clinic_id?: string | null
          created_at?: string | null
          denial_reason?: string | null
          diagnosis_codes?: Json | null
          id?: string
          medicare_paid?: number | null
          patient_id?: string
          patient_responsibility?: number | null
          procedure_codes?: Json | null
          processed_date?: string | null
          rendering_provider?: string | null
          service_date?: string
          status?: string | null
          submission_date?: string | null
          total_charge?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicare_medicaid_claims_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicare_medicaid_claims_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicare_medicaid_claims_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicare_medicaid_claims_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicare_medicaid_claims_rendering_provider_fkey"
            columns: ["rendering_provider"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      message_batches: {
        Row: {
          assigned_to_pool: string | null
          assigned_to_user_id: string | null
          batch_type: string
          clinic_id: string | null
          created_at: string | null
          id: string
          message_ids: Json | null
          processed_at: string | null
          scheduled_process_at: string
          status: string | null
        }
        Insert: {
          assigned_to_pool?: string | null
          assigned_to_user_id?: string | null
          batch_type: string
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          message_ids?: Json | null
          processed_at?: string | null
          scheduled_process_at: string
          status?: string | null
        }
        Update: {
          assigned_to_pool?: string | null
          assigned_to_user_id?: string | null
          batch_type?: string
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          message_ids?: Json | null
          processed_at?: string | null
          scheduled_process_at?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_batches_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_batches_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      message_deliveries: {
        Row: {
          channel: string
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          escalated: boolean | null
          escalated_at: string | null
          id: string
          message_id: string
          provider_message_id: string | null
          read_at: string | null
          recipient_id: string
          retry_count: number | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          channel: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          escalated?: boolean | null
          escalated_at?: string | null
          id?: string
          message_id: string
          provider_message_id?: string | null
          read_at?: string | null
          recipient_id: string
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          escalated?: boolean | null
          escalated_at?: string | null
          id?: string
          message_id?: string
          provider_message_id?: string | null
          read_at?: string | null
          recipient_id?: string
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      message_delivery_status: {
        Row: {
          created_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          message_id: string
          profile_name: string | null
          status: string
          updated_at: string | null
          wa_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          message_id: string
          profile_name?: string | null
          status: string
          updated_at?: string | null
          wa_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          message_id?: string
          profile_name?: string | null
          status?: string
          updated_at?: string | null
          wa_id?: string | null
        }
        Relationships: []
      }
      message_routing_rules: {
        Row: {
          assign_to_role: string | null
          auto_respond_macro_id: string | null
          batch_until: string | null
          clinic_id: string | null
          conditions: Json
          created_at: string | null
          enforce_quiet_hours: boolean | null
          escalation_threshold_minutes: number | null
          id: string
          is_active: boolean | null
          priority: number | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          route_to_pool: string | null
          rule_name: string
          rule_type: string
          updated_at: string | null
        }
        Insert: {
          assign_to_role?: string | null
          auto_respond_macro_id?: string | null
          batch_until?: string | null
          clinic_id?: string | null
          conditions: Json
          created_at?: string | null
          enforce_quiet_hours?: boolean | null
          escalation_threshold_minutes?: number | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          route_to_pool?: string | null
          rule_name: string
          rule_type: string
          updated_at?: string | null
        }
        Update: {
          assign_to_role?: string | null
          auto_respond_macro_id?: string | null
          batch_until?: string | null
          clinic_id?: string | null
          conditions?: Json
          created_at?: string | null
          enforce_quiet_hours?: boolean | null
          escalation_threshold_minutes?: number | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          route_to_pool?: string | null
          rule_name?: string
          rule_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_routing_rules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_routing_rules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          encrypted: boolean | null
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          encrypted?: boolean | null
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          encrypted?: boolean | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          moderated_by: string | null
          moderation_action: string
          original_content: string
          phi_detected: Json | null
          redacted_content: string | null
          toxicity_score: number | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          moderated_by?: string | null
          moderation_action: string
          original_content: string
          phi_detected?: Json | null
          redacted_content?: string | null
          toxicity_score?: number | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          moderated_by?: string | null
          moderation_action?: string
          original_content?: string
          phi_detected?: Json | null
          redacted_content?: string | null
          toxicity_score?: number | null
        }
        Relationships: []
      }
      monitoring_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          message: string
          metadata: Json | null
          severity: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          message: string
          metadata?: Json | null
          severity: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          message?: string
          metadata?: Json | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notification_channels: {
        Row: {
          channel_type: string
          channel_value: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_type: string
          channel_value: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_type?: string
          channel_value?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_delivery: {
        Row: {
          attempts: number | null
          channel: string
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          last_attempt_at: string | null
          message_content: Json | null
          notification_type: string
          status: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          channel: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          message_content?: Json | null
          notification_type: string
          status?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          channel?: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          message_content?: Json | null
          notification_type?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      patient_care_plans: {
        Row: {
          adherence_score: number | null
          clinic_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          pathway_id: string | null
          patient_id: string
          specialist_id: string
          start_date: string | null
          status: string | null
          target_end_date: string | null
          updated_at: string | null
        }
        Insert: {
          adherence_score?: number | null
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          pathway_id?: string | null
          patient_id: string
          specialist_id: string
          start_date?: string | null
          status?: string | null
          target_end_date?: string | null
          updated_at?: string | null
        }
        Update: {
          adherence_score?: number | null
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          pathway_id?: string | null
          patient_id?: string
          specialist_id?: string
          start_date?: string | null
          status?: string | null
          target_end_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_care_plans_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_care_plans_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_care_plans_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "care_pathways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_care_plans_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_care_team: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          ended_at: string | null
          id: string
          notes: string | null
          patient_id: string
          relationship_type: string
          role: string
          specialist_id: string | null
          started_at: string | null
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          relationship_type?: string
          role: string
          specialist_id?: string | null
          started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          relationship_type?: string
          role?: string
          specialist_id?: string | null
          started_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_care_team_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_care_team_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_care_team_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_care_team_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_search_preferences: {
        Row: {
          accessibility_requirements: Json | null
          created_at: string | null
          id: string
          max_distance_miles: number | null
          patient_id: string
          preferred_gender: string | null
          preferred_languages: string[] | null
          updated_at: string | null
        }
        Insert: {
          accessibility_requirements?: Json | null
          created_at?: string | null
          id?: string
          max_distance_miles?: number | null
          patient_id: string
          preferred_gender?: string | null
          preferred_languages?: string[] | null
          updated_at?: string | null
        }
        Update: {
          accessibility_requirements?: Json | null
          created_at?: string | null
          id?: string
          max_distance_miles?: number | null
          patient_id?: string
          preferred_gender?: string | null
          preferred_languages?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_intents: {
        Row: {
          amount: number
          appointment_id: string
          captured_at: string | null
          created_at: string | null
          currency: string
          id: string
          patient_id: string
          payment_method: string | null
          refund_eligibility: string | null
          specialist_id: string
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          appointment_id: string
          captured_at?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          patient_id: string
          payment_method?: string | null
          refund_eligibility?: string | null
          specialist_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string
          captured_at?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          patient_id?: string
          payment_method?: string | null
          refund_eligibility?: string | null
          specialist_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          payee_id: string
          payer_id: string
          platform_fee: number
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          specialist_payout: number
          status: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payee_id: string
          payer_id: string
          platform_fee: number
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          specialist_payout: number
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payee_id?: string
          payer_id?: string
          platform_fee?: number
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          specialist_payout?: number
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_schedules: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          currency: string
          id: string
          net_payout: number
          paid_at: string | null
          payout_method: string | null
          period_end: string
          period_start: string
          platform_fee: number
          specialist_id: string
          status: string
          total_earnings: number
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          net_payout: number
          paid_at?: string | null
          payout_method?: string | null
          period_end: string
          period_start: string
          platform_fee: number
          specialist_id: string
          status?: string
          total_earnings: number
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          net_payout?: number
          paid_at?: string | null
          payout_method?: string | null
          period_end?: string
          period_start?: string
          platform_fee?: number
          specialist_id?: string
          status?: string
          total_earnings?: number
        }
        Relationships: [
          {
            foreignKeyName: "payout_schedules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_schedules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pdmp_queries: {
        Row: {
          expires_at: string | null
          id: string
          patient_id: string
          prescription_history: Json | null
          queried_at: string | null
          query_reason: string
          red_flags: Json | null
          specialist_id: string
          state_queried: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          patient_id: string
          prescription_history?: Json | null
          queried_at?: string | null
          query_reason: string
          red_flags?: Json | null
          specialist_id: string
          state_queried: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          patient_id?: string
          prescription_history?: Json | null
          queried_at?: string | null
          query_reason?: string
          red_flags?: Json | null
          specialist_id?: string
          state_queried?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdmp_queries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdmp_queries_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string | null
          currency: string | null
          expires_at: string | null
          id: string
          paid_at: string | null
          payer_document: string | null
          payer_name: string | null
          payment_method: string | null
          pix_key: string
          pix_key_type: string
          qr_code: string | null
          qr_code_image_url: string | null
          status: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          payer_document?: string | null
          payer_name?: string | null
          payment_method?: string | null
          pix_key: string
          pix_key_type: string
          qr_code?: string | null
          qr_code_image_url?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          payer_document?: string | null
          payer_name?: string | null
          payment_method?: string | null
          pix_key?: string
          pix_key_type?: string
          qr_code?: string | null
          qr_code_image_url?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_template_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          specialist_id: string | null
          start_time: string
          template_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          specialist_id?: string | null
          start_time: string
          template_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          specialist_id?: string | null
          start_time?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_template_availability_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_template_availability_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "appointment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_renewals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string | null
          denial_reason: string | null
          id: string
          notes: string | null
          patient_id: string
          pharmacy_id: string | null
          prescription_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          denial_reason?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          pharmacy_id?: string | null
          prescription_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          denial_reason?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          pharmacy_id?: string | null
          prescription_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_renewals_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          digital_signature: string | null
          dispensed_at: string | null
          dosage: string
          duration_days: number | null
          expires_at: string | null
          frequency: string
          generic_name: string | null
          id: string
          instructions: string | null
          medication_name: string
          patient_country: string
          patient_id: string
          patient_number: string | null
          pharmacy_id: string | null
          prescription_number: string
          quantity: number | null
          refills_allowed: number | null
          refills_remaining: number | null
          requires_local_review: boolean | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specialist_country: string
          specialist_id: string
          status: Database["public"]["Enums"]["prescription_status"] | null
          updated_at: string | null
          warnings: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          digital_signature?: string | null
          dispensed_at?: string | null
          dosage: string
          duration_days?: number | null
          expires_at?: string | null
          frequency: string
          generic_name?: string | null
          id?: string
          instructions?: string | null
          medication_name: string
          patient_country: string
          patient_id: string
          patient_number?: string | null
          pharmacy_id?: string | null
          prescription_number: string
          quantity?: number | null
          refills_allowed?: number | null
          refills_remaining?: number | null
          requires_local_review?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialist_country: string
          specialist_id: string
          status?: Database["public"]["Enums"]["prescription_status"] | null
          updated_at?: string | null
          warnings?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          digital_signature?: string | null
          dispensed_at?: string | null
          dosage?: string
          duration_days?: number | null
          expires_at?: string | null
          frequency?: string
          generic_name?: string | null
          id?: string
          instructions?: string | null
          medication_name?: string
          patient_country?: string
          patient_id?: string
          patient_number?: string | null
          pharmacy_id?: string | null
          prescription_number?: string
          quantity?: number | null
          refills_allowed?: number | null
          refills_remaining?: number | null
          requires_local_review?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialist_country?: string
          specialist_id?: string
          status?: Database["public"]["Enums"]["prescription_status"] | null
          updated_at?: string | null
          warnings?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_answers: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          is_verified: boolean | null
          question_id: string
          specialist_id: string
          updated_at: string | null
          upvotes: number | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          question_id: string
          specialist_id: string
          updated_at?: string | null
          upvotes?: number | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          question_id?: string
          specialist_id?: string
          updated_at?: string | null
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "procedure_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "procedure_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_answers_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_catalog: {
        Row: {
          average_duration: number | null
          category: string
          contraindications: string[] | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          preparation_required: string | null
          procedure_name: string
          recovery_time: string | null
          success_rate: number | null
          symptoms_treated: string[] | null
          typical_cost_range: Json | null
          updated_at: string | null
        }
        Insert: {
          average_duration?: number | null
          category: string
          contraindications?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          preparation_required?: string | null
          procedure_name: string
          recovery_time?: string | null
          success_rate?: number | null
          symptoms_treated?: string[] | null
          typical_cost_range?: Json | null
          updated_at?: string | null
        }
        Update: {
          average_duration?: number | null
          category?: string
          contraindications?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          preparation_required?: string | null
          procedure_name?: string
          recovery_time?: string | null
          success_rate?: number | null
          symptoms_treated?: string[] | null
          typical_cost_range?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      procedure_checklist_items: {
        Row: {
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          id: string
          instructions: string | null
          is_completed: boolean | null
          procedure_id: string
          sequence_order: number | null
          task_name: string
          task_type: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_completed?: boolean | null
          procedure_id: string
          sequence_order?: number | null
          task_name: string
          task_type?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_completed?: boolean | null
          procedure_id?: string
          sequence_order?: number | null
          task_name?: string
          task_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedure_checklist_items_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedure_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_matches: {
        Row: {
          created_at: string | null
          id: string
          match_reason: Json | null
          match_score: number | null
          notification_sent: boolean | null
          notification_sent_at: string | null
          patient_id: string
          patient_viewed: boolean | null
          procedure_id: string
          specialist_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_reason?: Json | null
          match_score?: number | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          patient_id: string
          patient_viewed?: boolean | null
          procedure_id: string
          specialist_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          match_reason?: Json | null
          match_score?: number | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          patient_id?: string
          patient_viewed?: boolean | null
          procedure_id?: string
          specialist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_matches_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedure_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_matches_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_orders: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          location: string | null
          patient_id: string
          post_procedure_notes: string | null
          pre_procedure_instructions: string | null
          procedure_name: string
          procedure_type: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          specialist_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          location?: string | null
          patient_id: string
          post_procedure_notes?: string | null
          pre_procedure_instructions?: string | null
          procedure_name: string
          procedure_type?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          specialist_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          location?: string | null
          patient_id?: string
          post_procedure_notes?: string | null
          pre_procedure_instructions?: string | null
          procedure_name?: string
          procedure_type?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          specialist_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedure_orders_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_questions: {
        Row: {
          created_at: string | null
          id: string
          patient_id: string
          priority: string | null
          procedure_id: string | null
          question: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          patient_id: string
          priority?: string | null
          procedure_id?: string | null
          question: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          patient_id?: string
          priority?: string | null
          procedure_id?: string | null
          question?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedure_questions_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedure_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_connections: {
        Row: {
          connection_type: string | null
          created_at: string | null
          id: string
          message: string | null
          recipient_id: string
          requester_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          connection_type?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          recipient_id: string
          requester_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          connection_type?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          recipient_id?: string
          requester_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      professional_endorsements: {
        Row: {
          created_at: string | null
          endorsed_id: string | null
          endorsement_text: string | null
          endorser_id: string
          id: string
          is_verified: boolean | null
          relationship_type: string | null
          skill_category: string
        }
        Insert: {
          created_at?: string | null
          endorsed_id?: string | null
          endorsement_text?: string | null
          endorser_id: string
          id?: string
          is_verified?: boolean | null
          relationship_type?: string | null
          skill_category: string
        }
        Update: {
          created_at?: string | null
          endorsed_id?: string | null
          endorsement_text?: string | null
          endorser_id?: string
          id?: string
          is_verified?: boolean | null
          relationship_type?: string | null
          skill_category?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_endorsements_endorsed_id_fkey"
            columns: ["endorsed_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_analytics: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          metric_type: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          metric_type: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          viewer_id?: string | null
        }
        Relationships: []
      }
      profile_flags: {
        Row: {
          created_at: string | null
          description: string
          flag_type: string
          flagged_by: string
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          reviewed_by: string | null
          specialist_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          flag_type: string
          flagged_by: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          reviewed_by?: string | null
          specialist_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          flag_type?: string
          flagged_by?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          reviewed_by?: string | null
          specialist_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_flags_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_freshness_logs: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          field_name: string
          id: string
          is_verification: boolean | null
          new_value: string | null
          old_value: string | null
          specialist_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          field_name: string
          id?: string
          is_verification?: boolean | null
          new_value?: string | null
          old_value?: string | null
          specialist_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          field_name?: string
          id?: string
          is_verification?: boolean | null
          new_value?: string | null
          old_value?: string | null
          specialist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_freshness_logs_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_import_history: {
        Row: {
          clinic_id: string | null
          id: string
          imported_at: string | null
          imported_by: string | null
          imported_data: Json | null
          source: string
        }
        Insert: {
          clinic_id?: string | null
          id?: string
          imported_at?: string | null
          imported_by?: string | null
          imported_data?: Json | null
          source: string
        }
        Update: {
          clinic_id?: string | null
          id?: string
          imported_at?: string | null
          imported_by?: string | null
          imported_data?: Json | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_import_history_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_import_history_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_verifications: {
        Row: {
          created_at: string | null
          document_url: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          rejection_reason: string | null
          specialist_id: string
          updated_at: string | null
          verification_status: string | null
          verification_type: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_url?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          rejection_reason?: string | null
          specialist_id: string
          updated_at?: string | null
          verification_status?: string | null
          verification_type: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_url?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          rejection_reason?: string | null
          specialist_id?: string
          updated_at?: string | null
          verification_status?: string | null
          verification_type?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_verifications_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          allergies: string[] | null
          avatar_url: string | null
          blood_type: string | null
          can_self_login: boolean | null
          chronic_conditions: string[] | null
          city: string | null
          communication_preferences: Json | null
          country: string | null
          created_at: string | null
          created_by_clinic_id: string | null
          created_by_specialist_id: string | null
          current_medications: string[] | null
          date_of_birth: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          first_name: string
          gender: string | null
          id: string
          insurance_group: string | null
          insurance_id: string | null
          insurance_provider: string | null
          language_preference: string | null
          last_name: string
          patient_number: string | null
          patient_number_counter: number | null
          phone: string | null
          postal_code: string | null
          preferred_insurance: string | null
          preferred_language: string | null
          preferred_pharmacy: string | null
          preferred_timezone: string | null
          reminder_preferences: Json | null
          role: Database["public"]["Enums"]["user_role"]
          state: string | null
          timezone: string | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          blood_type?: string | null
          can_self_login?: boolean | null
          chronic_conditions?: string[] | null
          city?: string | null
          communication_preferences?: Json | null
          country?: string | null
          created_at?: string | null
          created_by_clinic_id?: string | null
          created_by_specialist_id?: string | null
          current_medications?: string[] | null
          date_of_birth?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name: string
          gender?: string | null
          id: string
          insurance_group?: string | null
          insurance_id?: string | null
          insurance_provider?: string | null
          language_preference?: string | null
          last_name: string
          patient_number?: string | null
          patient_number_counter?: number | null
          phone?: string | null
          postal_code?: string | null
          preferred_insurance?: string | null
          preferred_language?: string | null
          preferred_pharmacy?: string | null
          preferred_timezone?: string | null
          reminder_preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          timezone?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          blood_type?: string | null
          can_self_login?: boolean | null
          chronic_conditions?: string[] | null
          city?: string | null
          communication_preferences?: Json | null
          country?: string | null
          created_at?: string | null
          created_by_clinic_id?: string | null
          created_by_specialist_id?: string | null
          current_medications?: string[] | null
          date_of_birth?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          insurance_group?: string | null
          insurance_id?: string | null
          insurance_provider?: string | null
          language_preference?: string | null
          last_name?: string
          patient_number?: string | null
          patient_number_counter?: number | null
          phone?: string | null
          postal_code?: string | null
          preferred_insurance?: string | null
          preferred_language?: string | null
          preferred_pharmacy?: string | null
          preferred_timezone?: string | null
          reminder_preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          timezone?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_created_by_clinic_id_fkey"
            columns: ["created_by_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_created_by_clinic_id_fkey"
            columns: ["created_by_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_created_by_specialist_id_fkey"
            columns: ["created_by_specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_absences: {
        Row: {
          absence_type: string
          auto_redirect: boolean | null
          coverage_specialist_id: string | null
          created_at: string | null
          end_date: string
          id: string
          notification_sent: boolean | null
          reason: string | null
          specialist_id: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          absence_type: string
          auto_redirect?: boolean | null
          coverage_specialist_id?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          notification_sent?: boolean | null
          reason?: string | null
          specialist_id: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          absence_type?: string
          auto_redirect?: boolean | null
          coverage_specialist_id?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          notification_sent?: boolean | null
          reason?: string | null
          specialist_id?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_absences_coverage_specialist_id_fkey"
            columns: ["coverage_specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_absences_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_activity: {
        Row: {
          activity_score: number | null
          availability_updated_at: string | null
          clinic_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_appointment: string | null
          last_login: string | null
          last_profile_update: string | null
          response_time_avg: number | null
          specialist_id: string | null
          updated_at: string | null
        }
        Insert: {
          activity_score?: number | null
          availability_updated_at?: string | null
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_appointment?: string | null
          last_login?: string | null
          last_profile_update?: string | null
          response_time_avg?: number | null
          specialist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_score?: number | null
          availability_updated_at?: string | null
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_appointment?: string | null
          last_login?: string | null
          last_profile_update?: string | null
          response_time_avg?: number | null
          specialist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_activity_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_activity_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_activity_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      proxy_access_logs: {
        Row: {
          accessed_at: string | null
          action: string
          authorization_id: string
          id: string
          ip_address: string | null
          patient_id: string
          proxy_user_id: string
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string | null
          action: string
          authorization_id: string
          id?: string
          ip_address?: string | null
          patient_id: string
          proxy_user_id: string
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string | null
          action?: string
          authorization_id?: string
          id?: string
          ip_address?: string | null
          patient_id?: string
          proxy_user_id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proxy_access_logs_authorization_id_fkey"
            columns: ["authorization_id"]
            isOneToOne: false
            referencedRelation: "proxy_authorizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proxy_authorizations: {
        Row: {
          access_scope: Json | null
          consent_document_url: string | null
          created_at: string | null
          end_date: string | null
          id: string
          patient_id: string
          proxy_email: string
          proxy_name: string
          proxy_user_id: string
          relationship: string
          revoked_at: string | null
          revoked_by: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          access_scope?: Json | null
          consent_document_url?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          patient_id: string
          proxy_email: string
          proxy_name: string
          proxy_user_id: string
          relationship: string
          revoked_at?: string | null
          revoked_by?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          access_scope?: Json | null
          consent_document_url?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          patient_id?: string
          proxy_email?: string
          proxy_name?: string
          proxy_user_id?: string
          relationship?: string
          revoked_at?: string | null
          revoked_by?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          keys: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          keys: Json
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          keys?: Json
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          max_requests: number | null
          request_count: number | null
          updated_at: string | null
          window_duration: unknown | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          max_requests?: number | null
          request_count?: number | null
          updated_at?: string | null
          window_duration?: unknown | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          max_requests?: number | null
          request_count?: number | null
          updated_at?: string | null
          window_duration?: unknown | null
          window_start?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          item_id: string
          item_type: string
          metadata: Json | null
          reason: string | null
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          item_id: string
          item_type: string
          metadata?: Json | null
          reason?: string | null
          score?: number
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          metadata?: Json | null
          reason?: string | null
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      referral_networks: {
        Row: {
          active_referrals: number | null
          created_at: string | null
          id: string
          last_referral_at: string | null
          recipient_specialist_id: string
          referral_count: number | null
          sender_specialist_id: string
          specialties_referred: string[] | null
          trust_score: number | null
        }
        Insert: {
          active_referrals?: number | null
          created_at?: string | null
          id?: string
          last_referral_at?: string | null
          recipient_specialist_id: string
          referral_count?: number | null
          sender_specialist_id: string
          specialties_referred?: string[] | null
          trust_score?: number | null
        }
        Update: {
          active_referrals?: number | null
          created_at?: string | null
          id?: string
          last_referral_at?: string | null
          recipient_specialist_id?: string
          referral_count?: number | null
          sender_specialist_id?: string
          specialties_referred?: string[] | null
          trust_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_networks_recipient_specialist_id_fkey"
            columns: ["recipient_specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_networks_sender_specialist_id_fkey"
            columns: ["sender_specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          accepted_at: string | null
          attachments: Json | null
          clinical_summary: string | null
          completed_at: string | null
          created_at: string | null
          decline_reason: string | null
          diagnosis_codes: string[] | null
          from_specialist_id: string
          id: string
          patient_id: string
          reason: string
          referral_number: string | null
          scheduled_appointment_id: string | null
          specialty_requested: string
          status: string | null
          to_clinic_id: string | null
          to_specialist_id: string | null
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          accepted_at?: string | null
          attachments?: Json | null
          clinical_summary?: string | null
          completed_at?: string | null
          created_at?: string | null
          decline_reason?: string | null
          diagnosis_codes?: string[] | null
          from_specialist_id: string
          id?: string
          patient_id: string
          reason: string
          referral_number?: string | null
          scheduled_appointment_id?: string | null
          specialty_requested: string
          status?: string | null
          to_clinic_id?: string | null
          to_specialist_id?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          accepted_at?: string | null
          attachments?: Json | null
          clinical_summary?: string | null
          completed_at?: string | null
          created_at?: string | null
          decline_reason?: string | null
          diagnosis_codes?: string[] | null
          from_specialist_id?: string
          id?: string
          patient_id?: string
          reason?: string
          referral_number?: string | null
          scheduled_appointment_id?: string | null
          specialty_requested?: string
          status?: string | null
          to_clinic_id?: string | null
          to_specialist_id?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_from_specialist_id_fkey"
            columns: ["from_specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_scheduled_appointment_id_fkey"
            columns: ["scheduled_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_to_clinic_id_fkey"
            columns: ["to_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_to_clinic_id_fkey"
            columns: ["to_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_to_specialist_id_fkey"
            columns: ["to_specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          approved_by: string | null
          created_at: string | null
          id: string
          payment_intent_id: string
          processed_at: string | null
          refund_amount: number
          refund_policy_applied: string | null
          refund_reason: string
          requested_by: string
          status: string
          stripe_refund_id: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          id?: string
          payment_intent_id: string
          processed_at?: string | null
          refund_amount: number
          refund_policy_applied?: string | null
          refund_reason: string
          requested_by: string
          status?: string
          stripe_refund_id?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          id?: string
          payment_intent_id?: string
          processed_at?: string | null
          refund_amount?: number
          refund_policy_applied?: string | null
          refund_reason?: string
          requested_by?: string
          status?: string
          stripe_refund_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_intent_id_fkey"
            columns: ["payment_intent_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_bookings: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          end_time: string
          id: string
          resource_id: string | null
          start_time: string
          status: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          resource_id?: string | null
          start_time: string
          status?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          resource_id?: string | null
          start_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_bookings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_bookings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "clinic_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      response_macros: {
        Row: {
          available_variables: Json | null
          body_template: string
          category: string
          clinic_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          macro_name: string
          requires_customization: boolean | null
          subject_template: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          available_variables?: Json | null
          body_template: string
          category: string
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          macro_name: string
          requires_customization?: boolean | null
          subject_template?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          available_variables?: Json | null
          body_template?: string
          category?: string
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          macro_name?: string
          requires_customization?: boolean | null
          subject_template?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "response_macros_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_macros_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_splits: {
        Row: {
          appointment_id: string | null
          clinic_amount: number
          clinic_id: string | null
          clinic_percentage: number | null
          created_at: string | null
          id: string
          paid_at: string | null
          period_end: string
          period_start: string
          service_type: string
          specialist_amount: number
          specialist_id: string | null
          specialist_percentage: number | null
          status: string | null
          total_amount: number
        }
        Insert: {
          appointment_id?: string | null
          clinic_amount: number
          clinic_id?: string | null
          clinic_percentage?: number | null
          created_at?: string | null
          id?: string
          paid_at?: string | null
          period_end: string
          period_start: string
          service_type: string
          specialist_amount: number
          specialist_id?: string | null
          specialist_percentage?: number | null
          status?: string | null
          total_amount: number
        }
        Update: {
          appointment_id?: string | null
          clinic_amount?: number
          clinic_id?: string | null
          clinic_percentage?: number | null
          created_at?: string | null
          id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          service_type?: string
          specialist_amount?: number
          specialist_id?: string | null
          specialist_percentage?: number | null
          status?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "revenue_splits_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_splits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_splits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_splits_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      review_disputes: {
        Row: {
          assigned_mediator: string | null
          case_number: string | null
          created_at: string | null
          dispute_reason: string
          evidence_urls: Json | null
          filed_by: string
          id: string
          resolution: string | null
          resolved_at: string | null
          review_id: string
          review_quarantined: boolean | null
          status: string | null
        }
        Insert: {
          assigned_mediator?: string | null
          case_number?: string | null
          created_at?: string | null
          dispute_reason: string
          evidence_urls?: Json | null
          filed_by: string
          id?: string
          resolution?: string | null
          resolved_at?: string | null
          review_id: string
          review_quarantined?: boolean | null
          status?: string | null
        }
        Update: {
          assigned_mediator?: string | null
          case_number?: string | null
          created_at?: string | null
          dispute_reason?: string
          evidence_urls?: Json | null
          filed_by?: string
          id?: string
          resolution?: string | null
          resolved_at?: string | null
          review_id?: string
          review_quarantined?: boolean | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_disputes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_flags: {
        Row: {
          created_at: string | null
          flag_reason: string
          flag_type: string
          flagged_by: string | null
          id: string
          moderator_notes: string | null
          review_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          flag_reason: string
          flag_type: string
          flagged_by?: string | null
          id?: string
          moderator_notes?: string | null
          review_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          flag_reason?: string
          flag_type?: string
          flagged_by?: string | null
          id?: string
          moderator_notes?: string | null
          review_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_flags_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_responses: {
        Row: {
          created_at: string | null
          evidence_urls: Json | null
          id: string
          is_public: boolean | null
          moderation_status: string | null
          responder_id: string
          response_text: string
          review_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          evidence_urls?: Json | null
          id?: string
          is_public?: boolean | null
          moderation_status?: string | null
          responder_id: string
          response_text: string
          review_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          evidence_urls?: Json | null
          id?: string
          is_public?: boolean | null
          moderation_status?: string | null
          responder_id?: string
          response_text?: string
          review_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          administrative_feedback: string | null
          appeal_status: string | null
          appointment_id: string
          clinic_id: string | null
          clinical_feedback: string | null
          comment: string | null
          created_at: string | null
          flag_reason: string | null
          id: string
          is_anonymous: boolean | null
          is_flagged: boolean | null
          is_verified: boolean | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          moderation_status: string | null
          patient_id: string
          rating: number
          responded_at: string | null
          specialist_id: string
          specialist_response: string | null
          updated_at: string | null
        }
        Insert: {
          administrative_feedback?: string | null
          appeal_status?: string | null
          appointment_id: string
          clinic_id?: string | null
          clinical_feedback?: string | null
          comment?: string | null
          created_at?: string | null
          flag_reason?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_flagged?: boolean | null
          is_verified?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string | null
          patient_id: string
          rating: number
          responded_at?: string | null
          specialist_id: string
          specialist_response?: string | null
          updated_at?: string | null
        }
        Update: {
          administrative_feedback?: string | null
          appeal_status?: string | null
          appointment_id?: string
          clinic_id?: string | null
          clinical_feedback?: string | null
          comment?: string | null
          created_at?: string | null
          flag_reason?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_flagged?: boolean | null
          is_verified?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string | null
          patient_id?: string
          rating?: number
          responded_at?: string | null
          specialist_id?: string
          specialist_response?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          action: string
          conditions: Json | null
          created_at: string | null
          id: string
          resource: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          action: string
          conditions?: Json | null
          created_at?: string | null
          id?: string
          resource: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          action?: string
          conditions?: Json | null
          created_at?: string | null
          id?: string
          resource?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      rpm_devices: {
        Row: {
          created_at: string | null
          device_id: string
          device_name: string | null
          device_type: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          manufacturer: string | null
          paired_at: string | null
          patient_id: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          device_name?: string | null
          device_type: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          manufacturer?: string | null
          paired_at?: string | null
          patient_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          device_name?: string | null
          device_type?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          manufacturer?: string | null
          paired_at?: string | null
          patient_id?: string
        }
        Relationships: []
      }
      rpm_readings: {
        Row: {
          created_at: string | null
          device_id: string
          flag_reason: string | null
          flagged: boolean | null
          id: string
          metadata: Json | null
          patient_id: string
          reading_type: string
          recorded_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          unit: string
          value: number
        }
        Insert: {
          created_at?: string | null
          device_id: string
          flag_reason?: string | null
          flagged?: boolean | null
          id?: string
          metadata?: Json | null
          patient_id: string
          reading_type: string
          recorded_at: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          unit: string
          value: number
        }
        Update: {
          created_at?: string | null
          device_id?: string
          flag_reason?: string | null
          flagged?: boolean | null
          id?: string
          metadata?: Json | null
          patient_id?: string
          reading_type?: string
          recorded_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "rpm_readings_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "rpm_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      rpm_thresholds: {
        Row: {
          alert_recipients: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          max_value: number | null
          min_value: number | null
          patient_id: string
          reading_type: string
          specialist_id: string
          updated_at: string | null
        }
        Insert: {
          alert_recipients?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_value?: number | null
          min_value?: number | null
          patient_id: string
          reading_type: string
          specialist_id: string
          updated_at?: string | null
        }
        Update: {
          alert_recipients?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_value?: number | null
          min_value?: number | null
          patient_id?: string
          reading_type?: string
          specialist_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rpm_thresholds_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      secure_deliveries: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          delivery_confirmation: boolean | null
          delivery_method: string | null
          download_count: number | null
          encrypted_content: string
          expires_at: string | null
          id: string
          max_downloads: number | null
          message_type: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_confirmation?: boolean | null
          delivery_method?: string | null
          download_count?: number | null
          encrypted_content: string
          expires_at?: string | null
          id?: string
          max_downloads?: number | null
          message_type: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_confirmation?: boolean | null
          delivery_method?: string | null
          download_count?: number | null
          encrypted_content?: string
          expires_at?: string | null
          id?: string
          max_downloads?: number | null
          message_type?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      semantic_search_cache: {
        Row: {
          created_at: string | null
          id: string
          query_embedding: string | null
          query_text: string
          results: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          query_embedding?: string | null
          query_text: string
          results?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          query_embedding?: string | null
          query_text?: string
          results?: Json | null
        }
        Relationships: []
      }
      sensitive_access_alerts: {
        Row: {
          access_type: string
          accessed_by: string
          alert_sent: boolean | null
          alert_sent_at: string | null
          created_at: string | null
          id: string
          patient_id: string
          resource_id: string
          resource_type: string
        }
        Insert: {
          access_type: string
          accessed_by: string
          alert_sent?: boolean | null
          alert_sent_at?: string | null
          created_at?: string | null
          id?: string
          patient_id: string
          resource_id: string
          resource_type: string
        }
        Update: {
          access_type?: string
          accessed_by?: string
          alert_sent?: boolean | null
          alert_sent_at?: string | null
          created_at?: string | null
          id?: string
          patient_id?: string
          resource_id?: string
          resource_type?: string
        }
        Relationships: []
      }
      sepa_mandates: {
        Row: {
          activation_date: string | null
          cancellation_date: string | null
          clinic_id: string | null
          created_at: string | null
          creditor_identifier: string
          debtor_bic: string | null
          debtor_iban: string
          debtor_name: string
          id: string
          mandate_reference: string
          mandate_type: string | null
          signature_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activation_date?: string | null
          cancellation_date?: string | null
          clinic_id?: string | null
          created_at?: string | null
          creditor_identifier: string
          debtor_bic?: string | null
          debtor_iban: string
          debtor_name: string
          id?: string
          mandate_reference: string
          mandate_type?: string | null
          signature_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activation_date?: string | null
          cancellation_date?: string | null
          clinic_id?: string | null
          created_at?: string | null
          creditor_identifier?: string
          debtor_bic?: string | null
          debtor_iban?: string
          debtor_name?: string
          id?: string
          mandate_reference?: string
          mandate_type?: string | null
          signature_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sepa_mandates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sepa_mandates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sepa_mandates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_fees: {
        Row: {
          base_fee: number
          clinic_id: string | null
          created_at: string | null
          currency: string | null
          effective_date: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          payer_id: string | null
          payer_name: string | null
          service_code: string
          service_name: string
          specialist_id: string | null
          updated_at: string | null
        }
        Insert: {
          base_fee: number
          clinic_id?: string | null
          created_at?: string | null
          currency?: string | null
          effective_date?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          payer_id?: string | null
          payer_name?: string | null
          service_code: string
          service_name: string
          specialist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          base_fee?: number
          clinic_id?: string | null
          created_at?: string | null
          currency?: string | null
          effective_date?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          payer_id?: string | null
          payer_name?: string | null
          service_code?: string
          service_name?: string
          specialist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_fees_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_fees_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_fees_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      session_snapshots: {
        Row: {
          biometric_enabled: boolean | null
          created_at: string | null
          device_info: Json | null
          expires_at: string
          id: string
          session_data: Json
          user_id: string
        }
        Insert: {
          biometric_enabled?: boolean | null
          created_at?: string | null
          device_info?: Json | null
          expires_at: string
          id?: string
          session_data: Json
          user_id: string
        }
        Update: {
          biometric_enabled?: boolean | null
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string
          id?: string
          session_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      soap_notes: {
        Row: {
          ai_generated: boolean | null
          appointment_id: string
          assessment: string | null
          created_at: string | null
          id: string
          objective: string | null
          patient_id: string
          plan: string | null
          specialist_id: string
          subjective: string | null
          transcript_url: string | null
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          appointment_id: string
          assessment?: string | null
          created_at?: string | null
          id?: string
          objective?: string | null
          patient_id: string
          plan?: string | null
          specialist_id: string
          subjective?: string | null
          transcript_url?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          appointment_id?: string
          assessment?: string | null
          created_at?: string | null
          id?: string
          objective?: string | null
          patient_id?: string
          plan?: string | null
          specialist_id?: string
          subjective?: string | null
          transcript_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soap_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soap_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soap_notes_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_availability_cache: {
        Row: {
          available_slots: Json
          booked_slots: number
          cached_at: string
          created_at: string | null
          date: string
          expires_at: string
          id: string
          specialist_id: string
          total_slots: number
          utilization_pct: number
        }
        Insert: {
          available_slots: Json
          booked_slots: number
          cached_at?: string
          created_at?: string | null
          date: string
          expires_at: string
          id?: string
          specialist_id: string
          total_slots: number
          utilization_pct: number
        }
        Update: {
          available_slots?: Json
          booked_slots?: number
          cached_at?: string
          created_at?: string | null
          date?: string
          expires_at?: string
          id?: string
          specialist_id?: string
          total_slots?: number
          utilization_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "specialist_availability_cache_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_clinics: {
        Row: {
          clinic_id: string
          id: string
          is_active: boolean | null
          joined_at: string | null
          permissions: Json | null
          revenue_share_percentage: number | null
          role: string
          specialist_id: string
        }
        Insert: {
          clinic_id: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          revenue_share_percentage?: number | null
          role?: string
          specialist_id: string
        }
        Update: {
          clinic_id?: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          revenue_share_percentage?: number | null
          role?: string
          specialist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_clinics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_clinics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_clinics_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_performance_metrics: {
        Row: {
          appointments_cancelled: number | null
          appointments_completed: number | null
          average_rating: number | null
          clinic_id: string | null
          created_at: string | null
          id: string
          no_show_count: number | null
          patient_count: number | null
          period_end: string
          period_start: string
          specialist_id: string | null
          total_revenue: number | null
        }
        Insert: {
          appointments_cancelled?: number | null
          appointments_completed?: number | null
          average_rating?: number | null
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          no_show_count?: number | null
          patient_count?: number | null
          period_end: string
          period_start: string
          specialist_id?: string | null
          total_revenue?: number | null
        }
        Update: {
          appointments_cancelled?: number | null
          appointments_completed?: number | null
          average_rating?: number | null
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          no_show_count?: number | null
          patient_count?: number | null
          period_end?: string
          period_start?: string
          specialist_id?: string | null
          total_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "specialist_performance_metrics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_performance_metrics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_performance_metrics_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_procedures: {
        Row: {
          cases_performed: number | null
          created_at: string | null
          experience_years: number | null
          id: string
          is_verified: boolean | null
          last_verified_at: string | null
          procedure_id: string
          specialist_id: string
          verification_documents: Json | null
        }
        Insert: {
          cases_performed?: number | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          is_verified?: boolean | null
          last_verified_at?: string | null
          procedure_id: string
          specialist_id: string
          verification_documents?: Json | null
        }
        Update: {
          cases_performed?: number | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          is_verified?: boolean | null
          last_verified_at?: string | null
          procedure_id?: string
          specialist_id?: string
          verification_documents?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "specialist_procedures_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedure_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_procedures_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_search_cache: {
        Row: {
          cached_at: string
          created_at: string | null
          expires_at: string
          hit_count: number | null
          id: string
          result_count: number
          search_filters: Json
          search_key: string
          specialist_ids: string[]
        }
        Insert: {
          cached_at?: string
          created_at?: string | null
          expires_at: string
          hit_count?: number | null
          id?: string
          result_count: number
          search_filters: Json
          search_key: string
          specialist_ids: string[]
        }
        Update: {
          cached_at?: string
          created_at?: string | null
          expires_at?: string
          hit_count?: number | null
          id?: string
          result_count?: number
          search_filters?: Json
          search_key?: string
          specialist_ids?: string[]
        }
        Relationships: []
      }
      specialist_sponsorships: {
        Row: {
          amount_paid: number | null
          created_at: string | null
          end_date: string
          id: string
          is_active: boolean | null
          specialist_id: string
          sponsorship_type: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          specialist_id: string
          sponsorship_type: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          created_at?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          specialist_id?: string
          sponsorship_type?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "specialist_sponsorships_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_time_off: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          reason: string | null
          specialist_id: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          reason?: string | null
          specialist_id: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          specialist_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_time_off_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_verifications: {
        Row: {
          attestation_url: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          specialist_id: string
          status: string | null
          updated_at: string | null
          verification_date: string | null
          verification_document_url: string | null
          verification_type: string
          verified_by: string
        }
        Insert: {
          attestation_url?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          specialist_id: string
          status?: string | null
          updated_at?: string | null
          verification_date?: string | null
          verification_document_url?: string | null
          verification_type: string
          verified_by: string
        }
        Update: {
          attestation_url?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          specialist_id?: string
          status?: string | null
          updated_at?: string | null
          verification_date?: string | null
          verification_document_url?: string | null
          verification_type?: string
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_verifications_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialists: {
        Row: {
          accepts_insurance: boolean | null
          accepts_new_patients_date: string | null
          average_rating: number | null
          awards: string[] | null
          bio: string | null
          board_certifications: string[] | null
          clinical_focus: string[] | null
          conditions_treated: string[] | null
          consultation_fee_max: number | null
          consultation_fee_min: number | null
          created_at: string | null
          currency: string | null
          education: Json | null
          emergency_availability: boolean | null
          fee_transparency_level: string | null
          graduation_year: number | null
          hospital_affiliations: string[] | null
          id: string
          in_person_enabled: boolean | null
          insurance_accepted: string[] | null
          insurance_accepted_list: string[] | null
          is_accepting_patients: boolean | null
          is_online: boolean | null
          languages: string[] | null
          license_country: string
          license_expiry: string | null
          license_number: string
          license_state: string | null
          medical_school: string | null
          personal_statement: string | null
          practice_hours: Json | null
          professional_memberships: string[] | null
          publications: string[] | null
          research_interests: string[] | null
          specialty: string[]
          specialty_licenses: Json | null
          stripe_account_id: string | null
          sub_specialty: string[] | null
          telemedicine_platforms: string[] | null
          timezone: string | null
          total_consultations: number | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          verified_by: string | null
          video_consultation_enabled: boolean | null
          virtual_clinic_id: string | null
          years_experience: number | null
        }
        Insert: {
          accepts_insurance?: boolean | null
          accepts_new_patients_date?: string | null
          average_rating?: number | null
          awards?: string[] | null
          bio?: string | null
          board_certifications?: string[] | null
          clinical_focus?: string[] | null
          conditions_treated?: string[] | null
          consultation_fee_max?: number | null
          consultation_fee_min?: number | null
          created_at?: string | null
          currency?: string | null
          education?: Json | null
          emergency_availability?: boolean | null
          fee_transparency_level?: string | null
          graduation_year?: number | null
          hospital_affiliations?: string[] | null
          id?: string
          in_person_enabled?: boolean | null
          insurance_accepted?: string[] | null
          insurance_accepted_list?: string[] | null
          is_accepting_patients?: boolean | null
          is_online?: boolean | null
          languages?: string[] | null
          license_country: string
          license_expiry?: string | null
          license_number: string
          license_state?: string | null
          medical_school?: string | null
          personal_statement?: string | null
          practice_hours?: Json | null
          professional_memberships?: string[] | null
          publications?: string[] | null
          research_interests?: string[] | null
          specialty: string[]
          specialty_licenses?: Json | null
          stripe_account_id?: string | null
          sub_specialty?: string[] | null
          telemedicine_platforms?: string[] | null
          timezone?: string | null
          total_consultations?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
          video_consultation_enabled?: boolean | null
          virtual_clinic_id?: string | null
          years_experience?: number | null
        }
        Update: {
          accepts_insurance?: boolean | null
          accepts_new_patients_date?: string | null
          average_rating?: number | null
          awards?: string[] | null
          bio?: string | null
          board_certifications?: string[] | null
          clinical_focus?: string[] | null
          conditions_treated?: string[] | null
          consultation_fee_max?: number | null
          consultation_fee_min?: number | null
          created_at?: string | null
          currency?: string | null
          education?: Json | null
          emergency_availability?: boolean | null
          fee_transparency_level?: string | null
          graduation_year?: number | null
          hospital_affiliations?: string[] | null
          id?: string
          in_person_enabled?: boolean | null
          insurance_accepted?: string[] | null
          insurance_accepted_list?: string[] | null
          is_accepting_patients?: boolean | null
          is_online?: boolean | null
          languages?: string[] | null
          license_country?: string
          license_expiry?: string | null
          license_number?: string
          license_state?: string | null
          medical_school?: string | null
          personal_statement?: string | null
          practice_hours?: Json | null
          professional_memberships?: string[] | null
          publications?: string[] | null
          research_interests?: string[] | null
          specialty?: string[]
          specialty_licenses?: Json | null
          stripe_account_id?: string | null
          sub_specialty?: string[] | null
          telemedicine_platforms?: string[] | null
          timezone?: string | null
          total_consultations?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
          video_consultation_enabled?: boolean | null
          virtual_clinic_id?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "specialists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialists_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialists_virtual_clinic_id_fkey"
            columns: ["virtual_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialists_virtual_clinic_id_fkey"
            columns: ["virtual_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorships: {
        Row: {
          clinic_id: string | null
          cost: number
          created_at: string | null
          disclosure_text: string
          end_date: string
          id: string
          specialist_id: string | null
          sponsorship_type: string
          start_date: string
          status: string | null
        }
        Insert: {
          clinic_id?: string | null
          cost: number
          created_at?: string | null
          disclosure_text: string
          end_date: string
          id?: string
          specialist_id?: string | null
          sponsorship_type: string
          start_date: string
          status?: string | null
        }
        Update: {
          clinic_id?: string | null
          cost?: number
          created_at?: string | null
          disclosure_text?: string
          end_date?: string
          id?: string
          specialist_id?: string | null
          sponsorship_type?: string
          start_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsorships_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          stripe_customer_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          stripe_customer_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          stripe_customer_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_escalations: {
        Row: {
          created_at: string | null
          escalated_by: string
          escalated_to: string
          id: string
          reason: string
          resolved_at: string | null
          status: string
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          escalated_by: string
          escalated_to: string
          id?: string
          reason: string
          resolved_at?: string | null
          status?: string
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          escalated_by?: string
          escalated_to?: string
          id?: string
          reason?: string
          resolved_at?: string | null
          status?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_escalations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_interactions: {
        Row: {
          attachments: Json | null
          created_at: string | null
          id: string
          is_internal: boolean | null
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_interactions_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          attachments: Json | null
          created_at: string | null
          id: string
          is_staff: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_staff?: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_staff?: boolean | null
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_ratings: {
        Row: {
          feedback: string | null
          id: string
          rated_at: string | null
          rated_by: string
          rating: number
          ticket_id: string
        }
        Insert: {
          feedback?: string | null
          id?: string
          rated_at?: string | null
          rated_by: string
          rating: number
          ticket_id: string
        }
        Update: {
          feedback?: string | null
          id?: string
          rated_at?: string | null
          rated_by?: string
          rating?: number
          ticket_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string | null
          description: string
          escalated: boolean | null
          escalated_at: string | null
          id: string
          priority: string | null
          rating: number | null
          rating_comment: string | null
          resolution_notes: string | null
          resolved_at: string | null
          sla_deadline: string | null
          status: string | null
          subject: string
          ticket_number: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string | null
          description: string
          escalated?: boolean | null
          escalated_at?: string | null
          id?: string
          priority?: string | null
          rating?: number | null
          rating_comment?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: string | null
          subject: string
          ticket_number?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          description?: string
          escalated?: boolean | null
          escalated_at?: string | null
          id?: string
          priority?: string | null
          rating?: number | null
          rating_comment?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: string | null
          subject?: string
          ticket_number?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      symptom_checker_sessions: {
        Row: {
          ai_assessment: Json | null
          completed_at: string | null
          created_at: string | null
          id: string
          recommended_specialty: string | null
          symptoms: Json
          urgency_level: string | null
          user_id: string
        }
        Insert: {
          ai_assessment?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          recommended_specialty?: string | null
          symptoms: Json
          urgency_level?: string | null
          user_id: string
        }
        Update: {
          ai_assessment?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          recommended_specialty?: string | null
          symptoms?: Json
          urgency_level?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          is_active: boolean | null
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "team_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_conversations: {
        Row: {
          clinic_id: string | null
          conversation_type: string
          created_at: string | null
          created_by: string
          id: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          conversation_type: string
          created_at?: string | null
          created_by: string
          id?: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          conversation_type?: string
          created_at?: string | null
          created_by?: string
          id?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_conversations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_conversations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          attachments: Json | null
          conversation_id: string
          created_at: string | null
          id: string
          is_urgent: boolean | null
          message_content: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          conversation_id: string
          created_at?: string | null
          id?: string
          is_urgent?: boolean | null
          message_content: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_urgent?: boolean | null
          message_content?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "team_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      third_party_audits: {
        Row: {
          audit_date: string
          audit_type: string
          auditor_name: string
          certification_url: string | null
          clinic_id: string | null
          created_at: string | null
          expiry_date: string | null
          findings_summary: string | null
          id: string
          specialist_id: string | null
          status: string | null
        }
        Insert: {
          audit_date: string
          audit_type: string
          auditor_name: string
          certification_url?: string | null
          clinic_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          findings_summary?: string | null
          id?: string
          specialist_id?: string | null
          status?: string | null
        }
        Update: {
          audit_date?: string
          audit_type?: string
          auditor_name?: string
          certification_url?: string | null
          clinic_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          findings_summary?: string | null
          id?: string
          specialist_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "third_party_audits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "third_party_audits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "third_party_audits_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      tiss_submissions: {
        Row: {
          amount_approved: number | null
          amount_requested: number | null
          ans_code: string | null
          appointment_id: string | null
          batch_number: string | null
          clinic_id: string
          created_at: string | null
          id: string
          insurance_provider: string
          patient_id: string
          processed_at: string | null
          rejection_reason: string | null
          status: string | null
          submission_number: string | null
          submission_type: string
          submitted_at: string | null
          tiss_version: string | null
          updated_at: string | null
          xml_payload: string | null
        }
        Insert: {
          amount_approved?: number | null
          amount_requested?: number | null
          ans_code?: string | null
          appointment_id?: string | null
          batch_number?: string | null
          clinic_id: string
          created_at?: string | null
          id?: string
          insurance_provider: string
          patient_id: string
          processed_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          submission_number?: string | null
          submission_type: string
          submitted_at?: string | null
          tiss_version?: string | null
          updated_at?: string | null
          xml_payload?: string | null
        }
        Update: {
          amount_approved?: number | null
          amount_requested?: number | null
          ans_code?: string | null
          appointment_id?: string | null
          batch_number?: string | null
          clinic_id?: string
          created_at?: string | null
          id?: string
          insurance_provider?: string
          patient_id?: string
          processed_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          submission_number?: string | null
          submission_type?: string
          submitted_at?: string | null
          tiss_version?: string | null
          updated_at?: string | null
          xml_payload?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tiss_submissions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiss_submissions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiss_submissions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiss_submissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_cache: {
        Row: {
          created_at: string | null
          id: string
          source_language: string
          source_text: string
          target_language: string
          translated_text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          source_language: string
          source_text: string
          target_language: string
          translated_text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          source_language?: string
          source_text?: string
          target_language?: string
          translated_text?: string
        }
        Relationships: []
      }
      user_embeddings: {
        Row: {
          content_text: string
          content_type: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content_text: string
          content_type: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content_text?: string
          content_type?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_locale_preferences: {
        Row: {
          created_at: string | null
          currency: string | null
          date_format: string | null
          geo_location: string | null
          id: string
          preferred_language: string | null
          region_restrictions: Json | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          geo_location?: string | null
          id?: string
          preferred_language?: string | null
          region_restrictions?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          geo_location?: string | null
          id?: string
          preferred_language?: string | null
          region_restrictions?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          accessibility_mode: boolean | null
          created_at: string | null
          font_size: string | null
          high_contrast: boolean | null
          id: string
          language_preference: string | null
          reduced_motion: boolean | null
          screen_reader_optimized: boolean | null
          tutorial_progress: Json | null
          ui_mode: string | null
          updated_at: string | null
          user_id: string
          voice_assist_enabled: boolean | null
        }
        Insert: {
          accessibility_mode?: boolean | null
          created_at?: string | null
          font_size?: string | null
          high_contrast?: boolean | null
          id?: string
          language_preference?: string | null
          reduced_motion?: boolean | null
          screen_reader_optimized?: boolean | null
          tutorial_progress?: Json | null
          ui_mode?: string | null
          updated_at?: string | null
          user_id: string
          voice_assist_enabled?: boolean | null
        }
        Update: {
          accessibility_mode?: boolean | null
          created_at?: string | null
          font_size?: string | null
          high_contrast?: boolean | null
          id?: string
          language_preference?: string | null
          reduced_motion?: boolean | null
          screen_reader_optimized?: boolean | null
          tutorial_progress?: Json | null
          ui_mode?: string | null
          updated_at?: string | null
          user_id?: string
          voice_assist_enabled?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_name: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          last_active_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          last_active_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          last_active_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_cycles: {
        Row: {
          completed_at: string | null
          created_at: string | null
          due_date: string
          id: string
          reminder_sent_at: string | null
          specialist_id: string
          status: string | null
          updated_at: string | null
          verification_document_url: string | null
          verification_type: string
          verified_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          reminder_sent_at?: string | null
          specialist_id: string
          status?: string | null
          updated_at?: string | null
          verification_document_url?: string | null
          verification_type: string
          verified_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          reminder_sent_at?: string | null
          specialist_id?: string
          status?: string | null
          updated_at?: string | null
          verification_document_url?: string | null
          verification_type?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_cycles_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_reminders: {
        Row: {
          acknowledged_at: string | null
          completed_at: string | null
          created_at: string | null
          due_date: string
          id: string
          reminder_acknowledged: boolean | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          specialist_id: string
          verification_type: string
        }
        Insert: {
          acknowledged_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          reminder_acknowledged?: boolean | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          specialist_id: string
          verification_type: string
        }
        Update: {
          acknowledged_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          reminder_acknowledged?: boolean | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          specialist_id?: string
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_reminders_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_clinic_queue: {
        Row: {
          assigned_at: string | null
          assigned_specialist_id: string | null
          clinic_id: string
          completed_at: string | null
          estimated_wait_minutes: number | null
          id: string
          joined_at: string | null
          patient_id: string
          queue_position: number | null
          status: string | null
          symptoms: Json | null
          urgency_level: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_specialist_id?: string | null
          clinic_id: string
          completed_at?: string | null
          estimated_wait_minutes?: number | null
          id?: string
          joined_at?: string | null
          patient_id: string
          queue_position?: number | null
          status?: string | null
          symptoms?: Json | null
          urgency_level?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_specialist_id?: string | null
          clinic_id?: string
          completed_at?: string | null
          estimated_wait_minutes?: number | null
          id?: string
          joined_at?: string | null
          patient_id?: string
          queue_position?: number | null
          status?: string | null
          symptoms?: Json | null
          urgency_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "virtual_clinic_queue_assigned_specialist_id_fkey"
            columns: ["assigned_specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_clinic_queue_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_clinic_queue_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_clinic_revenue_splits: {
        Row: {
          clinic_id: string
          created_at: string | null
          id: string
          platform_fee_percentage: number | null
          specialist_id: string
          split_percentage: number
          updated_at: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          id?: string
          platform_fee_percentage?: number | null
          specialist_id: string
          split_percentage: number
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          id?: string
          platform_fee_percentage?: number | null
          specialist_id?: string
          split_percentage?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "virtual_clinic_revenue_splits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_clinic_revenue_splits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_clinic_revenue_splits_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_confirmations: {
        Row: {
          appointment_id: string
          created_at: string | null
          dispute_evidence: Json | null
          dispute_opened: boolean | null
          dispute_opened_at: string | null
          dispute_reason: string | null
          dispute_resolution: string | null
          dispute_resolved_at: string | null
          id: string
          patient_confirmed: boolean | null
          patient_confirmed_at: string | null
          patient_signature: string | null
          service_delivered: boolean | null
          specialist_confirmed: boolean | null
          specialist_confirmed_at: string | null
          specialist_signature: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string | null
          dispute_evidence?: Json | null
          dispute_opened?: boolean | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_resolution?: string | null
          dispute_resolved_at?: string | null
          id?: string
          patient_confirmed?: boolean | null
          patient_confirmed_at?: string | null
          patient_signature?: string | null
          service_delivered?: boolean | null
          specialist_confirmed?: boolean | null
          specialist_confirmed_at?: string | null
          specialist_signature?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string | null
          dispute_evidence?: Json | null
          dispute_opened?: boolean | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_resolution?: string | null
          dispute_resolved_at?: string | null
          id?: string
          patient_confirmed?: boolean | null
          patient_confirmed_at?: string | null
          patient_signature?: string | null
          service_delivered?: boolean | null
          specialist_confirmed?: boolean | null
          specialist_confirmed_at?: string | null
          specialist_signature?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_confirmations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_sessions: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          session_type: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          session_type: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          session_type?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: []
      }
      waitlist_matches: {
        Row: {
          accepted_at: string | null
          appointment_id: string | null
          declined_at: string | null
          id: string
          match_criteria: Json | null
          match_score: number | null
          matched_at: string | null
          notified_at: string | null
          waitlist_id: string
        }
        Insert: {
          accepted_at?: string | null
          appointment_id?: string | null
          declined_at?: string | null
          id?: string
          match_criteria?: Json | null
          match_score?: number | null
          matched_at?: string | null
          notified_at?: string | null
          waitlist_id: string
        }
        Update: {
          accepted_at?: string | null
          appointment_id?: string | null
          declined_at?: string | null
          id?: string
          match_criteria?: Json | null
          match_score?: number | null
          matched_at?: string | null
          notified_at?: string | null
          waitlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_matches_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_matches_waitlist_id_fkey"
            columns: ["waitlist_id"]
            isOneToOne: false
            referencedRelation: "appointment_waitlist"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          created_at: string | null
          direction: string
          id: string
          media_urls: Json | null
          message_body: string | null
          message_sid: string | null
          phone_number: string
          status: string | null
          user_id: string | null
          webhook_data: Json | null
        }
        Insert: {
          created_at?: string | null
          direction: string
          id?: string
          media_urls?: Json | null
          message_body?: string | null
          message_sid?: string | null
          phone_number: string
          status?: string | null
          user_id?: string | null
          webhook_data?: Json | null
        }
        Update: {
          created_at?: string | null
          direction?: string
          id?: string
          media_urls?: Json | null
          message_body?: string | null
          message_sid?: string | null
          phone_number?: string
          status?: string | null
          user_id?: string | null
          webhook_data?: Json | null
        }
        Relationships: []
      }
      work_queue_items: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          first_viewed_at: string | null
          id: string
          item_id: string
          item_type: string
          queue_id: string
          requires_md_review: boolean | null
          status: string | null
          time_to_completion_minutes: number | null
          time_to_first_view_minutes: number | null
          topic: string | null
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          first_viewed_at?: string | null
          id?: string
          item_id: string
          item_type: string
          queue_id: string
          requires_md_review?: boolean | null
          status?: string | null
          time_to_completion_minutes?: number | null
          time_to_first_view_minutes?: number | null
          topic?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          first_viewed_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          queue_id?: string
          requires_md_review?: boolean | null
          status?: string | null
          time_to_completion_minutes?: number | null
          time_to_first_view_minutes?: number | null
          topic?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_queue_items_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "work_queues"
            referencedColumns: ["id"]
          },
        ]
      }
      work_queues: {
        Row: {
          assign_by_skill: boolean | null
          auto_assign_enabled: boolean | null
          clinic_id: string | null
          created_at: string | null
          current_item_count: number | null
          eligible_user_ids: Json | null
          id: string
          is_active: boolean | null
          max_concurrent_items: number | null
          queue_name: string
          queue_type: string
          target_closure_minutes: number | null
          target_response_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          assign_by_skill?: boolean | null
          auto_assign_enabled?: boolean | null
          clinic_id?: string | null
          created_at?: string | null
          current_item_count?: number | null
          eligible_user_ids?: Json | null
          id?: string
          is_active?: boolean | null
          max_concurrent_items?: number | null
          queue_name: string
          queue_type: string
          target_closure_minutes?: number | null
          target_response_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          assign_by_skill?: boolean | null
          auto_assign_enabled?: boolean | null
          clinic_id?: string | null
          created_at?: string | null
          current_item_count?: number | null
          eligible_user_ids?: Json | null
          id?: string
          is_active?: boolean | null
          max_concurrent_items?: number | null
          queue_name?: string
          queue_type?: string
          target_closure_minutes?: number | null
          target_response_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_queues_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_queues_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      clinics_public: {
        Row: {
          address_line1: string | null
          average_rating: number | null
          city: string | null
          clinic_type: Database["public"]["Enums"]["clinic_type"] | null
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string | null
          is_active: boolean | null
          languages_supported: string[] | null
          logo_url: string | null
          mission_statement: string | null
          name: string | null
          operating_hours: Json | null
          phone: string | null
          postal_code: string | null
          slug: string | null
          specialties: string[] | null
          staff_count: number | null
          state: string | null
          tagline: string | null
          website: string | null
        }
        Relationships: []
      }
      message_conversations: {
        Row: {
          conversation_id: string | null
          last_message: string | null
          last_message_at: string | null
          recipient_avatar: string | null
          recipient_id: string | null
          recipient_name: string | null
          sender_avatar: string | null
          sender_id: string | null
          sender_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      generate_api_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_patient_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_clinic_ids: {
        Args: { _user_id: string }
        Returns: string[]
      }
      grant_master_admin: {
        Args: { _granted_by?: string; _user_id: string }
        Returns: boolean
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_clinic_owner: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      is_clinic_staff: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      log_activity: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_target_id?: string
          p_target_type?: string
          p_user_id: string
        }
        Returns: string
      }
      refresh_availability_cache: {
        Args: {
          p_end_date: string
          p_specialist_id: string
          p_start_date: string
        }
        Returns: number
      }
      revoke_admin_role: {
        Args: { _revoked_by?: string; _user_id: string }
        Returns: boolean
      }
      search_user_embeddings: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content_text: string
          content_type: string
          id: string
          metadata: Json
          similarity: number
          user_id: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      update_api_key_usage: {
        Args: { p_key: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      ai_audit_action:
        | "create"
        | "update"
        | "approve"
        | "rollback"
        | "retire"
        | "deploy"
      ai_context: "patient" | "clinic" | "internal" | "specialist"
      ai_source_status: "approved" | "pending" | "retired" | "under_review"
      ai_source_type:
        | "guideline"
        | "ontology"
        | "formulary"
        | "internal_protocol"
        | "journal_api"
        | "fhir_resource"
      app_role:
        | "patient"
        | "specialist"
        | "clinic_admin"
        | "clinic_staff"
        | "support_agent"
        | "admin"
        | "moderator"
      appointment_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      clinic_type: "virtual" | "physical" | "hybrid"
      consultation_type: "video" | "in_person" | "phone" | "chat"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
      prescription_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "rejected"
        | "dispensed"
        | "cancelled"
      urgency_level: "emergency" | "urgent" | "moderate" | "routine"
      user_role:
        | "patient"
        | "specialist"
        | "clinic_admin"
        | "reviewer"
        | "super_admin"
        | "admin"
      verification_status: "pending" | "in_review" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_audit_action: [
        "create",
        "update",
        "approve",
        "rollback",
        "retire",
        "deploy",
      ],
      ai_context: ["patient", "clinic", "internal", "specialist"],
      ai_source_status: ["approved", "pending", "retired", "under_review"],
      ai_source_type: [
        "guideline",
        "ontology",
        "formulary",
        "internal_protocol",
        "journal_api",
        "fhir_resource",
      ],
      app_role: [
        "patient",
        "specialist",
        "clinic_admin",
        "clinic_staff",
        "support_agent",
        "admin",
        "moderator",
      ],
      appointment_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      clinic_type: ["virtual", "physical", "hybrid"],
      consultation_type: ["video", "in_person", "phone", "chat"],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
      prescription_status: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "dispensed",
        "cancelled",
      ],
      urgency_level: ["emergency", "urgent", "moderate", "routine"],
      user_role: [
        "patient",
        "specialist",
        "clinic_admin",
        "reviewer",
        "super_admin",
        "admin",
      ],
      verification_status: ["pending", "in_review", "verified", "rejected"],
    },
  },
} as const
