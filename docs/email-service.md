# TOTL Agency - Email Service Integration

**Last Updated:** October 19, 2025  
**Status:** ✅ Production Ready - Full Email Notification System Implemented

## Table of Contents
- [Overview](#overview)
- [Setup](#setup)
- [Email Templates](#email-templates)
- [Usage Patterns](#usage-patterns)
- [Integration Points](#integration-points)
- [Troubleshooting](#troubleshooting)

## 📧 Overview

TOTL Agency uses **Resend** for transactional emails, providing reliable email delivery for user notifications, verification, and platform communications.

### **Email Types**

#### **Authentication Emails**
- **Welcome Emails** - New user onboarding
- **Verification Emails** - Email address verification
- **Password Reset** - Account recovery

#### **Application Workflow Emails** ✨ NEW
- **Application Received** (to talent) - Confirmation of application submission
- **New Application** (to client) - Alert client about new application
- **Application Accepted** (to talent) - Congratulations on acceptance
- **Application Rejected** (to talent) - Professional rejection notification
- **Client Application Follow-Up** (to applicant + admin) - Automated reminder when review exceeds 3 days

#### **Booking Workflow Emails** ✨ NEW
- **Booking Confirmed** (to talent) - Booking details and preparation checklist
- **Booking Reminder** (to talent) - 24-hour reminder before booking

#### **Coming Soon**
- **Gig Invitations** - Direct invitations from clients to talent

## ⚙️ Setup

### **Environment Variables**
```env
# Required for email functionality
RESEND_API_KEY=your_resend_api_key

# Optional - Custom domain
RESEND_DOMAIN=your-domain.com
```

### **Resend Configuration**
1. **Sign up** at [resend.com](https://resend.com)
2. **Get API key** from dashboard
3. **Verify domain** (optional but recommended)
4. **Add environment variable** to your deployment

### **Installation**
```bash
# Install Resend SDK
npm install resend
```

## 📝 Email Templates

### **Welcome Email**
```typescript
// lib/email-templates.tsx
export function WelcomeEmail({ 
  name, 
  role, 
  verificationUrl 
}: { 
  name: string; 
  role: string; 
  verificationUrl: string; 
}) {
  return (
    <div>
      <h1>Welcome to TOTL Agency, {name}!</h1>
      <p>Your {role} account has been created successfully.</p>
      <p>Please verify your email address to get started:</p>
      <a href={verificationUrl}>Verify Email</a>
    </div>
  );
}
```

### **Password Reset Email**
```typescript
export function PasswordResetEmail({ 
  resetUrl 
}: { 
  resetUrl: string; 
}) {
  return (
    <div>
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href={resetUrl}>Reset Password</a>
      <p>This link will expire in 1 hour.</p>
    </div>
  );
}
```

### **Application Notification**
```typescript
export function ApplicationNotificationEmail({ 
  talentName, 
  gigTitle, 
  status 
}: { 
  talentName: string; 
  gigTitle: string; 
  status: string; 
}) {
  return (
    <div>
      <h1>Application Update</h1>
      <p>Your application for "{gigTitle}" has been {status}.</p>
      <p>Log in to your dashboard for more details.</p>
    </div>
  );
}
```

## 🔗 Integration Points

### **Application Submission Flow**
**File:** `app/gigs/[id]/apply/actions.ts`

When a talent applies to a gig:
1. ✅ **Application Received Email** → Sent to talent
2. ✅ **New Application Email** → Sent to client

```typescript
// After successful application insert
await fetch('/api/email/send-application-received', {
  method: 'POST',
  body: JSON.stringify({
    email: talent.email,
    firstName: talent.first_name,
    gigTitle: gig.title,
  }),
});

await fetch('/api/email/send-new-application-client', {
  method: 'POST',
  body: JSON.stringify({
    email: client.email,
    clientName: client.full_name,
    gigTitle: gig.title,
  }),
});
```

### **Application Acceptance Flow**
**File:** `app/api/client/applications/accept/route.ts`

When a client accepts an application:
1. ✅ **Application Accepted Email** → Sent to talent
2. ✅ **Booking Confirmed Email** → Sent to talent

```typescript
// After creating booking and updating application status
await fetch('/api/email/send-application-accepted', {
  method: 'POST',
  body: JSON.stringify({
    email: talent.email,
    talentName: `${talent.first_name} ${talent.last_name}`,
    gigTitle: gig.title,
    clientName: client.full_name,
  }),
});

await fetch('/api/email/send-booking-confirmed', {
  method: 'POST',
  body: JSON.stringify({
    email: talent.email,
    talentName: `${talent.first_name} ${talent.last_name}`,
    gigTitle: gig.title,
    bookingDate: booking.date,
    bookingLocation: gig.location,
    compensation: booking.compensation,
  }),
});
```

### **Application Rejection Flow**
**File:** `lib/actions/booking-actions.ts`

When a client rejects an application:
1. ✅ **Application Rejected Email** → Sent to talent

```typescript
// After updating application status to rejected
await fetch('/api/email/send-application-rejected', {
  method: 'POST',
  body: JSON.stringify({
    email: talent.email,
    talentName: `${talent.first_name} ${talent.last_name}`,
    gigTitle: gig.title,
  }),
});
```

### **Client Application Follow-Up Automation** 🚀
**File / Action:** `lib/actions/client-actions.ts` → `sendClientApplicationFollowUpReminders`  
**Trigger:** Admin dashboard button (“Send follow-ups”) or scheduled cron hitting a small server action/route.

1. Queries `client_applications` for records with `status = 'pending'`, no `follow_up_sent_at`, and `created_at <= now() - 3 days`
2. Sends two emails per older application:
   - ✅ Applicant follow-up (“we’re still reviewing”) generated via `generateClientApplicationFollowUpApplicantEmail`
   - ✅ Admin reminder email (`generateClientApplicationFollowUpAdminEmail`) so ops stays on SLA
3. Updates `client_applications.follow_up_sent_at` to track completion and prevent duplicates
4. Returns structured telemetry so the admin UI can toast success/failure and mark rows locally

### **Email API Routes**

All email routes are located in `app/api/email/`:

| Route | Purpose | Recipient |
|-------|---------|-----------|
| `send-welcome/` | Welcome new users | New users |
| `send-verification/` | Email verification | Users needing verification |
| `send-password-reset/` | Password reset links | Users requesting reset |
| `send-application-received/` | Application confirmation | Talent (applicant) |
| `send-new-application-client/` | New application alert | Client (gig owner) |
| `send-application-accepted/` | Application acceptance | Talent (applicant) |
| `send-application-rejected/` | Application rejection | Talent (applicant) |
| `send-booking-confirmed/` | Booking confirmation | Talent (booked) |

### **Email Templates**

All email templates are generated in `lib/services/email-templates.tsx`:

| Template Function | Email Type |
|------------------|------------|
| `generateWelcomeEmail()` | Welcome |
| `generateVerificationEmail()` | Verification |
| `generatePasswordResetEmail()` | Password Reset |
| `generateApplicationReceivedEmail()` | Application Received |
| `generateNewApplicationClientEmail()` | New Application (Client) |
| `generateApplicationAcceptedEmail()` | Application Accepted |
| `generateApplicationRejectedEmail()` | Application Rejected |
| `generateClientApplicationConfirmationEmail()` | Client Application Confirmation |
| `generateClientApplicationAdminNotificationEmail()` | Client Application Admin Alert |
| `generateClientApplicationApprovedEmail()` | Client Application Approved |
| `generateClientApplicationRejectedEmail()` | Client Application Rejected |
| `generateClientApplicationFollowUpApplicantEmail()` | Client Application Follow-Up (Applicant) |
| `generateClientApplicationFollowUpAdminEmail()` | Client Application Follow-Up (Admin Reminder) |
| `generateBookingConfirmedEmail()` | Booking Confirmed |
| `generateBookingReminderEmail()` | Booking Reminder (CRON) |

## 💻 Usage Patterns

### **Email Service Setup**
```typescript
// lib/email-service.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailService = {
  async sendWelcomeEmail(email: string, name: string, role: string) {
    try {
      const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify?token=${token}`;
      
      await resend.emails.send({
        from: 'TOTL Agency <noreply@yourdomain.com>',
        to: email,
        subject: 'Welcome to TOTL Agency!',
        react: WelcomeEmail({ name, role, verificationUrl }),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error };
    }
  },

  async sendPasswordReset(email: string, resetToken: string) {
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${resetToken}`;
      
      await resend.emails.send({
        from: 'TOTL Agency <noreply@yourdomain.com>',
        to: email,
        subject: 'Reset Your Password',
        react: PasswordResetEmail({ resetUrl }),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error };
    }
  },

  async sendApplicationNotification(
    email: string, 
    talentName: string, 
    gigTitle: string, 
    status: string
  ) {
    try {
      await resend.emails.send({
        from: 'TOTL Agency <noreply@yourdomain.com>',
        to: email,
        subject: `Application ${status} - ${gigTitle}`,
        react: ApplicationNotificationEmail({ talentName, gigTitle, status }),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error sending application notification:', error);
      return { success: false, error };
    }
  },
};
```

### **API Route Usage**
```typescript
// app/api/email/send-welcome/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email, name, role } = await request.json();
    
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const result = await emailService.sendWelcomeEmail(email, name, role);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in send-welcome route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### **Component Integration**
```typescript
// components/auth-provider.tsx
import { emailService } from '@/lib/email-service';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const signUp = async (email: string, password: string, metadata: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      // Send welcome email
      if (data.user) {
        await emailService.sendWelcomeEmail(
          email,
          metadata.first_name || 'User',
          metadata.role || 'talent'
        );
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { data: null, error };
    }
  };
  
  // ... rest of provider
}
```

## 🔧 Troubleshooting

### **Common Issues**

#### **1. "Invalid API Key"**
```bash
# Check environment variable
echo $RESEND_API_KEY

# Verify in .env.local
RESEND_API_KEY=re_xxxxxxxxxxxx
```

#### **2. "Domain not verified"**
```typescript
// Use a verified domain or Resend's default
const fromEmail = process.env.RESEND_DOMAIN 
  ? `noreply@${process.env.RESEND_DOMAIN}`
  : 'TOTL Agency <onboarding@resend.dev>';
```

#### **3. "Email not sending"**
```typescript
// Add error logging
try {
  const result = await resend.emails.send({
    from: 'TOTL Agency <noreply@yourdomain.com>',
    to: email,
    subject: 'Test Email',
    html: '<p>Test email content</p>',
  });
  
  console.log('Email sent:', result);
} catch (error) {
  console.error('Email error:', error);
  // Check Resend dashboard for delivery status
}
```

### **Testing Emails**

#### **Development Testing**
```typescript
// Test email service locally
const testEmail = async () => {
  const result = await emailService.sendWelcomeEmail(
    'test@example.com',
    'Test User',
    'talent'
  );
  
  console.log('Test result:', result);
};

// Call in development
if (process.env.NODE_ENV === 'development') {
  testEmail();
}
```

### **Email Templates Best Practices**

#### **1. Responsive Design**
```typescript
export function ResponsiveEmail({ content }: { content: string }) {
  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px' 
      }}>
        {content}
      </div>
    </div>
  );
}
```

#### **2. Clear Call-to-Action**
```typescript
export function CallToActionButton({ 
  text, 
  url 
}: { 
  text: string; 
  url: string; 
}) {
  return (
    <a 
      href={url}
      style={{
        display: 'inline-block',
        backgroundColor: '#007bff',
        color: 'white',
        padding: '12px 24px',
        textDecoration: 'none',
        borderRadius: '4px',
        marginTop: '16px'
      }}
    >
      {text}
    </a>
  );
}
```

#### **3. Fallback Content**
```typescript
export function EmailWithFallback({ 
  children 
}: { 
  children: React.ReactNode; 
}) {
  return (
    <div>
      {/* HTML fallback for email clients */}
      <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>
        Please enable HTML emails to view this content.
      </div>
      
      {/* Main content */}
      {children}
      
      {/* Footer */}
      <div style={{ 
        marginTop: '32px', 
        paddingTop: '16px', 
        borderTop: '1px solid #e9ecef',
        fontSize: '12px',
        color: '#6c757d'
      }}>
        <p>TOTL Agency - Connecting Talent with Opportunities</p>
        <p>If you have questions, please contact support@totlagency.com</p>
      </div>
    </div>
  );
}
```

---

**For complete email integration details, see the email service implementation in `lib/email-service.ts`.**
