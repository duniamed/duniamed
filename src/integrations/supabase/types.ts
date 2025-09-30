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
          address_line1: string | null
          address_line2: string | null
          city: string | null
          clinic_type: Database["public"]["Enums"]["clinic_type"]
          country: string | null
          created_at: string | null
          created_by: string
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          license_number: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          operating_hours: Json | null
          phone: string | null
          postal_code: string | null
          specialties: string[] | null
          state: string | null
          stripe_customer_id: string | null
          subscription_expires_at: string | null
          subscription_tier: string | null
          tax_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          clinic_type: Database["public"]["Enums"]["clinic_type"]
          country?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          license_number?: string | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          operating_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          specialties?: string[] | null
          state?: string | null
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          clinic_type?: Database["public"]["Enums"]["clinic_type"]
          country?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          license_number?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          operating_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          specialties?: string[] | null
          state?: string | null
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          tax_id?: string | null
          updated_at?: string | null
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
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          first_name: string
          gender: string | null
          id: string
          language_preference: string | null
          last_name: string
          phone: string | null
          postal_code: string | null
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
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          first_name: string
          gender?: string | null
          id: string
          language_preference?: string | null
          last_name: string
          phone?: string | null
          postal_code?: string | null
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
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          first_name?: string
          gender?: string | null
          id?: string
          language_preference?: string | null
          last_name?: string
          phone?: string | null
          postal_code?: string | null
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
          average_rating: number | null
          bio: string | null
          consultation_fee_max: number | null
          consultation_fee_min: number | null
          created_at: string | null
          currency: string | null
          graduation_year: number | null
          id: string
          in_person_enabled: boolean | null
          is_accepting_patients: boolean | null
          languages: string[] | null
          license_country: string
          license_expiry: string | null
          license_number: string
          license_state: string | null
          medical_school: string | null
          specialty: string[]
          stripe_account_id: string | null
          sub_specialty: string[] | null
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
          years_experience: number | null
        }
        Insert: {
          average_rating?: number | null
          bio?: string | null
          consultation_fee_max?: number | null
          consultation_fee_min?: number | null
          created_at?: string | null
          currency?: string | null
          graduation_year?: number | null
          id?: string
          in_person_enabled?: boolean | null
          is_accepting_patients?: boolean | null
          languages?: string[] | null
          license_country: string
          license_expiry?: string | null
          license_number: string
          license_state?: string | null
          medical_school?: string | null
          specialty: string[]
          stripe_account_id?: string | null
          sub_specialty?: string[] | null
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
          years_experience?: number | null
        }
        Update: {
          average_rating?: number | null
          bio?: string | null
          consultation_fee_max?: number | null
          consultation_fee_min?: number | null
          created_at?: string | null
          currency?: string | null
          graduation_year?: number | null
          id?: string
          in_person_enabled?: boolean | null
          is_accepting_patients?: boolean | null
          languages?: string[] | null
          license_country?: string
          license_expiry?: string | null
          license_number?: string
          license_state?: string | null
          medical_school?: string | null
          specialty?: string[]
          stripe_account_id?: string | null
          sub_specialty?: string[] | null
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
        ]
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
    }
    Views: {
      clinics_public: {
        Row: {
          city: string | null
          clinic_type: Database["public"]["Enums"]["clinic_type"] | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string | null
          operating_hours: Json | null
          specialties: string[] | null
          state: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          clinic_type?: Database["public"]["Enums"]["clinic_type"] | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          operating_hours?: Json | null
          specialties?: string[] | null
          state?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          clinic_type?: Database["public"]["Enums"]["clinic_type"] | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          operating_hours?: Json | null
          specialties?: string[] | null
          state?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
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
      ],
      verification_status: ["pending", "in_review", "verified", "rejected"],
    },
  },
} as const
