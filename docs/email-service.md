# TOTL Agency - Email Service Integration

**Last Updated:** July 23, 2025  
**Status:** Production Ready

## Table of Contents
- [Overview](#overview)
- [Setup](#setup)
- [Email Templates](#email-templates)
- [Usage Patterns](#usage-patterns)
- [Troubleshooting](#troubleshooting)

## 📧 Overview

TOTL Agency uses **Resend** for transactional emails, providing reliable email delivery for user notifications, verification, and platform communications.

### **Email Types**
- **Welcome Emails** - New user onboarding
- **Verification Emails** - Email address verification
- **Password Reset** - Account recovery
- **Application Notifications** - Gig application updates
- **Booking Confirmations** - Confirmed engagements

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

#### **Production Monitoring**
```typescript
// Add monitoring to email service
export const emailService = {
  async sendWelcomeEmail(email: string, name: string, role: string) {
    const startTime = Date.now();
    
    try {
      const result = await resend.emails.send({
        // ... email config
      });
      
      // Log success metrics
      console.log(`Welcome email sent to ${email} in ${Date.now() - startTime}ms`);
      
      return { success: true, data: result };
    } catch (error) {
      // Log error metrics
      console.error(`Failed to send welcome email to ${email}:`, error);
      
      // Send to monitoring service in production
      if (process.env.NODE_ENV === 'production') {
        // logError('email_send_failed', { email, error });
      }
      
      return { success: false, error };
    }
  },
};
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
