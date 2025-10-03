# External Integrations Guide

This document lists all external integrations needed for C15-C19 features and how to set them up.

## C15 Privacy - No External Integrations Required ✅
**Status:** Fully functional with Supabase
- Data access logging: Built-in with Supabase
- Consent management: Custom implementation
- Data deletion: Supabase + edge functions
- Encryption: Supabase built-in encryption at rest

**Optional enhancements:**
- KMS/HSM: AWS KMS or HashiCorp Vault for additional encryption
- Compliance tools: OneTrust or TrustArc for GDPR/HIPAA workflows

---

## C16 Pricing - Stripe Integration Required 💳

### **Stripe (Required for subscriptions)**
**Website:** https://stripe.com  
**Purpose:** Payment processing, subscriptions, billing

**Setup Steps:**
1. Create account at https://stripe.com
2. Complete business verification
3. Get API keys from https://dashboard.stripe.com/apikeys
4. Add secret `STRIPE_SECRET_KEY_LOV` in Supabase (already configured)
5. Create products and prices in Stripe dashboard:
   - Basic Plan: $9.99/month or $99.99/year
   - Professional Plan: $29.99/month or $299.99/year
   - Enterprise Plan: $99.99/month or $999.99/year

**Features Used:**
- Subscription management
- Usage-based billing
- Invoice generation
- Payment method storage
- Webhook events for status updates

**Webhook URL:** `https://knybxihimqrqwzkdeaio.supabase.co/functions/v1/stripe-webhook`

---

## C17 Essentials - No External Integrations Required ✅
**Status:** Fully functional with built-in feature flags
- Feature flags: Custom Supabase implementation
- Entitlements: Database-driven logic
- Roadmap voting: Custom UI + database

**Optional enhancements:**
- LaunchDarkly: Advanced feature flag management
- ProductBoard: Professional roadmap management

---

## C18 Calendars - Drag-Drop Library Installed ✅

### **@dnd-kit (Installed)**
**Website:** https://dndkit.com  
**Purpose:** Drag-and-drop calendar interface

**Setup:** Already installed via npm
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

**Features:**
- Drag-drop time slots
- Keyboard navigation
- Touch support
- Accessibility compliant

### **Real-time Sync (Built-in)**
**Using:** Supabase Realtime
- Automatic updates across devices
- WebSocket-based
- No additional setup needed

---

## C19 Telehealth - Daily.co Integration Configured ✅

### **Daily.co (Already Configured)**
**Website:** https://daily.co  
**Purpose:** Video calling infrastructure

**Current Status:** API key already configured as `DAILY_API_KEY`

**If you need to update:**
1. Login to https://dashboard.daily.co
2. Get your API key from Settings > API Keys
3. Update secret in Supabase dashboard

**Features Used:**
- Video room creation
- Meeting tokens
- Call quality monitoring
- Screen sharing
- Recording (optional)

**Edge Function:** `create-video-room` handles Daily.co integration

---

## Multi-Channel Notifications (Already Configured) ✅

### **Twilio SMS (Configured)**
Secrets already set:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

### **Resend Email (Configured)**
Secret already set:
- `RESEND_API_KEY`

### **Push Notifications**
Using web push API (browser built-in, no external service needed)

---

## Summary: What You Need to Register For

### Required Now:
1. **Stripe** - For subscription payments
   - Create account: https://stripe.com/register
   - Add products and prices
   - Configure webhook

### Already Configured:
- Daily.co (video calls)
- Twilio (SMS)
- Resend (email)
- Supabase (database, auth, storage)

### Optional (Nice to Have):
- AWS KMS (advanced encryption)
- LaunchDarkly (enterprise feature flags)
- ProductBoard (professional roadmap management)
- OneTrust (compliance automation)

---

## Testing Mode

All integrations support test/sandbox mode:
- **Stripe:** Use test API keys for development
- **Daily.co:** Dev tier with limited rooms
- **Twilio:** Test credentials for SMS testing

This allows full feature testing without charges before going live!
