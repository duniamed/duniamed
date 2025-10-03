# C20-C24 Features: Integration Requirements

This document outlines the external integrations needed for C20-C24 features, what you need to register for, and how to configure them.

---

## C20 SUPPORT - Support Ticket System

### Purpose
Patients escalate to human agents, track tickets with SLA timers. Specialists see published hours, escalate to supervisors. Clinics enforce SLAs and route by language/region.

### Integrations Used

#### **Built-in (No Registration Required)**
- ✅ **Supabase Database**: Stores support tickets, interactions, and escalations
- ✅ **Lovable AI Translation**: Already configured for multilingual support (uses `translate-support` edge function)
- ✅ **Twilio SMS**: Already configured for SMS notifications (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` are set)
- ✅ **Resend Email**: Already configured for email notifications (`RESEND_API_KEY` is set)

#### **Optional External Integrations**
- ⚠️ **Live Chat Service** (optional): Integrate services like Intercom, Zendesk Chat, or Crisp for real-time chat
  - Registration: Sign up at your chosen provider
  - Integration: Add API keys via Supabase secrets
  - Use case: Real-time support chat alongside ticket system

- ⚠️ **Voice/IVR System** (optional): Services like Twilio Voice for phone support
  - Registration: Already have Twilio account (SMS is configured)
  - Additional setup: Enable Twilio Voice in your Twilio console
  - Use case: Phone support escalation

- ⚠️ **CSAT Analytics** (optional): Built-in with database tracking, or use external tools like Delighted
  - Registration: Optional - only if you want advanced analytics
  - Use case: Advanced customer satisfaction tracking

### Current Status
✅ **Fully Functional** - Core support ticketing works out of the box with email/SMS notifications

---

## C21 CONNECTORS - Integration Management

### Purpose
Patients consent to data sharing across systems. Specialists request integrations and activate connectors. Clinics track integration status and deploy plug-ins for EHR/CRM/billing systems.

### Integrations Used

#### **Built-in (No Registration Required)**
- ✅ **Supabase Database**: Stores connector configurations, sync logs, and consents
- ✅ **Webhook System**: Built-in for real-time data sync
- ✅ **Audit Logging**: Automatic tracking of all sync activities

#### **External Integrations (Registration Required)**

1. **FHIR/HL7 EHR Systems** (if you want EHR integration)
   - ⚠️ **Registration Required**: Contact your EHR vendor
   - Common EHR systems:
     - Epic FHIR API: https://fhir.epic.com/
     - Cerner FHIR API: https://fhir.cerner.com/
     - Allscripts: https://www.allscripts.com/
   - Setup: Obtain API credentials from your EHR vendor
   - Add credentials to Supabase secrets
   - Use case: Sync patient records, appointments, prescriptions

2. **CRM Systems** (if you want patient CRM integration)
   - ⚠️ **Registration Required**: Sign up for a CRM service
   - Options:
     - Salesforce Health Cloud: https://www.salesforce.com/products/health-cloud/overview/
     - HubSpot: https://www.hubspot.com/
   - Setup: Create API keys in your CRM admin panel
   - Add to Supabase secrets
   - Use case: Sync patient contact info, communication history

3. **Billing/Payment APIs** (beyond Stripe)
   - ⚠️ **Optional**: If you need additional billing integrations
   - Options:
     - QuickBooks API: https://developer.intuit.com/
     - Xero API: https://developer.xero.com/
   - Use case: Advanced accounting and invoicing

### Current Status
✅ **Core System Ready** - Connector framework is built. Add external API credentials as needed.

**How to Add External Connector:**
1. Register with your chosen service
2. Obtain API credentials
3. Add credentials via Supabase secrets:
   ```bash
   # Example for Epic FHIR
   EPIC_CLIENT_ID=your_client_id
   EPIC_CLIENT_SECRET=your_client_secret
   ```
4. Configure in the Integration Connectors page

---

## C22 RBAC - Role-Based Access Control

### Purpose
Patients see who accessed their data and receive alerts. Specialists apply role templates and monitor access logs. Clinics build custom roles and maintain HIPAA audit trails.

### Integrations Used

#### **Built-in (No Registration Required)**
- ✅ **Supabase RLS**: Database-level security enforcing role-based access
- ✅ **Audit Logging**: Automatic immutable logs for all data access
- ✅ **Alert System**: Built-in notifications for sensitive data access
- ✅ **Policy Engine**: Server-side function `has_role()` for permission checks

#### **Optional External Integrations**
- ⚠️ **SIEM/SOAR Tools** (optional): For advanced security monitoring
  - Options: Splunk, LogRhythm, or open-source OSSEC
  - Registration: Sign up for enterprise security monitoring
  - Use case: Advanced threat detection, compliance reporting
  - Setup: Configure log forwarding to SIEM

- ⚠️ **Compliance Tools** (optional): For automated compliance checks
  - Options: Vanta, Drata, or Secureframe
  - Use case: Automated HIPAA/GDPR compliance monitoring
  - Setup: Connect via API for continuous compliance scanning

### Current Status
✅ **Fully Functional** - Complete RBAC system with audit trails works out of the box

---

## C23 ENGAGEMENT - Patient Engagement & Campaigns

### Purpose
Patients receive personalized reminders, tasks, and education. Specialists compose wellness reminders and follow-up templates. Clinics track engagement analytics and run preventive campaigns.

### Integrations Used

#### **Built-in (No Registration Required)**
- ✅ **Supabase Database**: Stores campaigns, tasks, and analytics
- ✅ **Twilio SMS**: Already configured for SMS reminders
- ✅ **Resend Email**: Already configured for email reminders
- ✅ **Push Notifications**: Browser-based web push (no external service needed)
- ✅ **Campaign Analytics**: Built-in tracking and reporting

#### **Optional External Integrations**
- ⚠️ **WhatsApp Business API** (optional): For WhatsApp messaging
  - Registration: Sign up at https://business.whatsapp.com/
  - Setup: Requires Twilio WhatsApp or direct Meta integration
  - Use case: Reach patients on WhatsApp

- ⚠️ **Marketing Automation** (optional): For advanced campaign management
  - Options: Customer.io, SendGrid Marketing Campaigns
  - Use case: Advanced segmentation and A/B testing

- ⚠️ **Education CMS** (optional): For health education content
  - Options: WordPress with Health API, custom CMS
  - Use case: Deliver educational articles and videos

### Current Status
✅ **Fully Functional** - SMS and email reminders work out of the box. Add WhatsApp for additional channels.

---

## C24 PAYMENTS - Payment Processing & Invoicing

### Purpose
Patients pay at booking and receive itemized receipts. Specialists get balance alerts and secure payouts. Clinics operate refund consoles with appointment-linked billing.

### Integrations Used

#### **Already Configured**
- ✅ **Stripe**: Payment processing already set up (`STRIPE_SECRET_KEY_LOV` is configured)
  - Supports: Credit cards, digital wallets, international payments
  - Refunds: Automated refund processing
  - Invoicing: Automatic invoice generation

#### **Required Stripe Setup (One-Time)**
⚠️ **You need to complete Stripe setup:**

1. **Log in to Stripe Dashboard**: https://dashboard.stripe.com/
2. **Create Products/Prices**:
   - Go to Products → Add Product
   - Create products for:
     - Consultation fees
     - Procedure costs
     - Subscription tiers (if applicable)
3. **Configure Webhook**:
   - Go to Developers → Webhooks
   - Add endpoint: `https://knybxihimqrqwzkdeaio.supabase.co/functions/v1/stripe-webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.failed`, `charge.refunded`
4. **Set up Payouts** (for specialists):
   - Go to Settings → Payouts
   - Configure payout schedule (daily, weekly, monthly)
5. **Tax Configuration**:
   - Go to Settings → Tax
   - Enable tax collection if needed for your jurisdiction

#### **Optional External Integrations**
- ⚠️ **Accounting Software** (optional): For advanced bookkeeping
  - Options: QuickBooks, Xero, FreshBooks
  - Use case: Automated accounting and financial reports

- ⚠️ **Payment Terminals** (optional): For in-person payments
  - Stripe Terminal: https://stripe.com/terminal
  - Use case: Physical clinic payments

### Current Status
⚠️ **Stripe Active, Setup Required** - API key is configured, but you must set up products, prices, and webhooks in Stripe Dashboard.

---

## Summary: What You Need to Register For

### **Immediate (Required for Full Functionality)**
✅ **Stripe Setup**: Complete product/price configuration (C24)
   - Link: https://dashboard.stripe.com/

### **Optional (Enhance Existing Features)**
⚠️ **FHIR/EHR Integration**: If you want to sync with hospital systems (C21)
   - Contact your EHR vendor for API access

⚠️ **CRM Integration**: If you want advanced patient management (C21)
   - Salesforce Health Cloud, HubSpot, etc.

⚠️ **WhatsApp Business**: If you want to send reminders via WhatsApp (C23)
   - Link: https://business.whatsapp.com/

⚠️ **SIEM/SOAR Tools**: If you want enterprise-grade security monitoring (C22)
   - Splunk, LogRhythm, etc.

### **Already Configured (No Action Needed)**
✅ Twilio SMS  
✅ Resend Email  
✅ Stripe Payments (API key set, needs dashboard setup)  
✅ Daily.co Video  
✅ Supabase Database/Auth/Storage  
✅ Lovable AI Translation  

---

## Testing Integrations

All integrations support test/sandbox modes:

- **Stripe**: Use test mode with test cards (4242 4242 4242 4242)
- **Twilio**: Test with verified numbers
- **EHR APIs**: Most provide sandbox environments
- **CRM**: Test with free/trial accounts

---

## Need Help?

- Review integration logs in Supabase Dashboard → Database → Tables
- Check edge function logs for errors
- Contact support if you need assistance with specific integrations
