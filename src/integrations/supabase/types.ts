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
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at: string | null
          currency: string | null
          duration_minutes: number | null
          fee: number
          id: string
          notes: string | null
          patient_id: string
          payment_id: string | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          scheduled_at: string
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
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at?: string | null
          currency?: string | null
          duration_minutes?: number | null
          fee: number
          id?: string
          notes?: string | null
          patient_id: string
          payment_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          scheduled_at: string
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
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string | null
          currency?: string | null
          duration_minutes?: number | null
          fee?: number
          id?: string
          notes?: string | null
          patient_id?: string
          payment_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          scheduled_at?: string
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
          id: string
          insurance_accepted: string[] | null
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
          id?: string
          insurance_accepted?: string[] | null
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
          id?: string
          insurance_accepted?: string[] | null
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
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          allergies: string[] | null
          avatar_url: string | null
          blood_type: string | null
          chronic_conditions: string[] | null
          city: string | null
          communication_preferences: Json | null
          country: string | null
          created_at: string | null
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
          chronic_conditions?: string[] | null
          city?: string | null
          communication_preferences?: Json | null
          country?: string | null
          created_at?: string | null
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
          chronic_conditions?: string[] | null
          city?: string | null
          communication_preferences?: Json | null
          country?: string | null
          created_at?: string | null
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
        Relationships: []
      }
      reviews: {
        Row: {
          appointment_id: string
          comment: string | null
          created_at: string | null
          flag_reason: string | null
          id: string
          is_anonymous: boolean | null
          is_flagged: boolean | null
          is_verified: boolean | null
          patient_id: string
          rating: number
          responded_at: string | null
          specialist_id: string
          specialist_response: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id: string
          comment?: string | null
          created_at?: string | null
          flag_reason?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_flagged?: boolean | null
          is_verified?: boolean | null
          patient_id: string
          rating: number
          responded_at?: string | null
          specialist_id: string
          specialist_response?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string
          comment?: string | null
          created_at?: string | null
          flag_reason?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_flagged?: boolean | null
          is_verified?: boolean | null
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
          graduation_year: number | null
          hospital_affiliations: string[] | null
          id: string
          in_person_enabled: boolean | null
          insurance_accepted: string[] | null
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
          graduation_year?: number | null
          hospital_affiliations?: string[] | null
          id?: string
          in_person_enabled?: boolean | null
          insurance_accepted?: string[] | null
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
          graduation_year?: number | null
          hospital_affiliations?: string[] | null
          id?: string
          in_person_enabled?: boolean | null
          insurance_accepted?: string[] | null
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
        Insert: {
          address_line1?: string | null
          average_rating?: never
          city?: string | null
          clinic_type?: Database["public"]["Enums"]["clinic_type"] | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          languages_supported?: string[] | null
          logo_url?: string | null
          mission_statement?: string | null
          name?: string | null
          operating_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          slug?: never
          specialties?: string[] | null
          staff_count?: never
          state?: string | null
          tagline?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          average_rating?: never
          city?: string | null
          clinic_type?: Database["public"]["Enums"]["clinic_type"] | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          languages_supported?: string[] | null
          logo_url?: string | null
          mission_statement?: string | null
          name?: string | null
          operating_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          slug?: never
          specialties?: string[] | null
          staff_count?: never
          state?: string | null
          tagline?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_clinic_ids: {
        Args: { _user_id: string }
        Returns: string[]
      }
      is_clinic_owner: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      is_clinic_staff: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
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
