# TOTL Agency - Complete User Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Platform Architecture](#platform-architecture)
3. [Talent User Experience](#talent-user-experience)
4. [Career Builder User Experience](#career-builder-user-experience)
5. [Admin User Experience](#admin-user-experience)
6. [Key Features & Workflows](#key-features--workflows)
7. [Technical Implementation](#technical-implementation)

---

## Overview

### What is TOTL Agency?

TOTL Agency is a **premium talent booking platform** that connects models, actors, and influencers with casting directors, brands, and creative professionals. The platform streamlines the entire talent discovery, booking, and management process.

### Mission Statement
> "The Future of Talent Booking - Connect with exceptional talent instantly and bring your vision to life."

### Core Value Proposition
- **For Talent**: Discover opportunities, showcase portfolios, apply to gigs, and manage bookings in one place
- **For Career Builders**: Post gigs, review applications, book talent, and manage projects seamlessly
- **For Admins**: Oversee platform operations, manage users, monitor applications, and ensure quality

---

## Platform Architecture

### User Roles

The platform supports three distinct user roles, each with specific capabilities:

1. **Talent** - Models, actors, influencers seeking opportunities
2. **Career Builder** - Companies, casting directors, creative professionals who post gigs and hire talent
3. **Admin** - TOTL Agency staff who oversee platform operations

### Technology Stack

- **Frontend**: Next.js 15.2.4 with App Router, React 18, TypeScript 5
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **UI Framework**: TailwindCSS + shadcn/ui components
- **Email**: Resend API for custom transactional emails
- **Monitoring**: Sentry for error tracking and performance monitoring
- **Security**: Row-Level Security (RLS) policies on all database tables

---

## Talent User Experience

### 🎯 Purpose & Goals

As a **Talent user**, the platform helps you:
- **Discover Opportunities**: Browse and search available gigs matching your skills
- **Build Your Brand**: Create a professional profile with portfolio showcase
- **Apply Efficiently**: Submit applications with custom cover letters
- **Track Progress**: Monitor application status and manage bookings
- **Grow Your Career**: Access analytics and performance metrics

### 🚀 Getting Started

#### 1. Sign Up & Profile Creation

**What You'll Do:**
1. Visit `/choose-role` and select "Join as Talent"
2. Complete email verification
3. Fill out your talent profile:
   - **Basic Info**: First name, last name, date of birth
   - **Professional Details**: Experience level, categories, bio
   - **Physical Attributes**: Height, weight, measurements (optional)
   - **Contact**: Phone, location, social media links
   - **Portfolio**: Upload photos showcasing your work

**What to Expect:**
- Clean, modern onboarding flow
- Profile completion progress indicator (85% target)
- Real-time validation and helpful error messages
- Auto-save functionality to prevent data loss

#### 2. Dashboard Overview

**URL**: `/talent/dashboard`

**What You'll See:**

**Top Stats Cards:**
- 📊 **Profile Views**: How many times your profile was viewed
- 📝 **Applications**: Total applications submitted
- 📅 **Bookings**: Confirmed gigs
- 💰 **Earnings**: Total compensation from completed gigs
- ⭐ **Rating**: Your average Career Builder rating
- 📈 **Success Rate**: Application acceptance rate

**Main Tabs:**

**Overview Tab:**
- **Profile Strength Widget**: Shows completion percentage with actionable items
- **Available Gigs**: Quick count of active opportunities
- **Quick Stats**: Applications and acceptance metrics
- **Upcoming Gigs**: Next confirmed bookings with details

**Applications Tab:**
- View all your applications (New, Accepted, Rejected)
- Filter by status and search by gig name
- See application date and current status
- Quick actions: View details, withdraw application

**Bookings Tab:**
- All confirmed gigs you're booked for
- Upcoming and past bookings
- Gig details: date, location, compensation
- Career Builder contact information
- Booking status tracking

**Discover Tab:**
- Browse available gigs without leaving dashboard
- Quick apply functionality
- Category and location filters
- Compensation range visibility

### 📱 Key Workflows

#### Workflow 1: Finding & Applying to Gigs

**Step-by-Step Experience:**

1. **Browse Gigs** (`/gigs`)
   - See grid of available opportunities
   - Each card shows:
     - Gig title and featured image
     - Category badge (Modeling, Acting, Photography, Video, Influencer, Dancer, Musician)
     - Location, compensation, and date
     - "View Details" button
   - Use filters: Search keywords, category, location, compensation

2. **View Gig Details** (`/gigs/[id]`)
   - Full gig description
   - Detailed information:
     - Location
     - Compensation range
     - Date/time
     - Posted date
   - Career Builder information:
     - Company name
     - Role (Career Builder/admin)
   - **"Apply Now"** button (if not already applied)
   - Or **"Application Submitted"** badge (if already applied)

3. **Submit Application** (`/gigs/[id]/apply`)
   - See gig summary at top
   - Write optional cover letter (up to 1000 characters)
   - Character counter shows remaining space
   - Click **"Submit Application"**
   - Loading state: "Submitting..." with spinner
   - Success: Automatically redirected to dashboard
   - Your application count increases
   - Toast notification confirms submission

4. **Track Application**
   - Go to Dashboard → Applications tab
   - See your application with status:
     - 🟡 **New**: Under review
     - 🟢 **Accepted**: Career Builder wants to book you!
     - 🔴 **Rejected**: Not selected this time
   - View application details and cover letter
   - Withdraw application if needed (before review)

#### Workflow 2: Managing Your Portfolio

**Purpose**: Showcase your best work to potential clients

**Location**: `/settings` → Portfolio Section

**What You Can Do:**

1. **Upload Photos**
   - Multiple image upload support
   - Drag & drop interface
   - File size limit: 5MB per image
   - Supported formats: JPG, PNG, WEBP
   - Automatic optimization and compression

2. **Organize Portfolio**
   - Drag to reorder images
   - Set primary/featured image (shows first)
   - Add titles and descriptions to each photo
   - Delete images you no longer want

3. **Portfolio Gallery**
   - Beautiful grid layout
   - Click to view full-size
   - Lightbox with navigation
   - Quick edit functionality

**Best Practices:**
- Upload at least 5-10 high-quality photos
- Include variety: headshots, full body, action shots
- Keep portfolio updated with recent work
- Use descriptive titles

#### Workflow 3: Profile Management

**Location**: `/settings`

**Sections:**

**Basic Information:**
- Display name (how you appear to clients)
- Avatar/profile photo
- Contact email
- Phone number

**Talent Details:**
- Professional bio (sell yourself!)
- Categories (select all that apply)
- Experience level (Beginner → Expert)
- Physical attributes
- Available locations

**Account Settings:**
- Email notifications (application updates, new gigs)
- Privacy settings
- Password management
- Account deletion

**Portfolio Section:**
- Manage your photos
- Reorder, edit, delete
- Upload new images

### 💡 What to Expect

**Positive Experiences:**
- ✅ Fast, responsive interface
- ✅ Real-time updates on application status
- ✅ Beautiful portfolio showcase
- ✅ Easy gig discovery and application
- ✅ Clear communication with clients
- ✅ Transparent compensation and terms

**Potential Friction Points:**
- ⚠️ Must complete profile before applying (85% minimum)
- ⚠️ Cannot apply to same gig twice
- ⚠️ Limited ability to contact clients directly (goes through platform)
- ⚠️ Need email verification before full access

**Success Metrics:**
- Profile completion: 85%+
- Application acceptance rate: Track in dashboard
- Career Builder ratings: Maintain 4.5+ stars
- Booking consistency: Regular gig bookings

---

## Career Builder User Experience

### 🎯 Purpose & Goals

As a **Career Builder**, the platform helps you:
- **Post Gigs**: Create detailed casting calls and opportunities
- **Review Applications**: See who's interested and qualified
- **Book Talent**: Accept applications and create bookings
- **Manage Projects**: Track bookings and communicate with talent
- **Build Relationships**: Rate talent and build your network

### 🚀 Getting Started

#### 1. Sign Up & Company Profile

**What You'll Do:**
1. Visit `/choose-role` and select "Join as Career Builder"
2. Complete email verification
3. Fill out your Career Builder profile:
   - **Company Info**: Company name, industry, website
   - **Contact Details**: Phone, email, location
   - **Bio**: Company description and casting focus
   - **Verification**: Business credentials (for premium features)

#### 2. Career Builder Dashboard

**URL**: `/client/dashboard`

**What You'll See:**

**Quick Stats:**
- 📝 **Active Gigs**: Currently open opportunities
- 👥 **Total Applications**: Applications received
- ✅ **Confirmed Bookings**: Talent booked
- ⭐ **Average Rating**: Your rating from talent

**Main Sections:**

**Active Gigs:**
- List of your posted gigs
- Application counts per gig
- Quick actions: View, edit, close

**Recent Applications:**
- Latest applications to your gigs
- Quick review and decision buttons
- Talent profile previews

**Upcoming Bookings:**
- Confirmed talent for upcoming gigs
- Contact information
- Booking details and status

### 📱 Key Workflows

#### Workflow 1: Posting a Gig

**Location**: `/post-gig`

**Step-by-Step:**

1. **Fill Out Gig Details**
   - **Title**: Clear, descriptive (e.g., "NYC Editorial Shoot")
   - **Description**: Full details of the opportunity
   - **Category**: Modeling, Acting, Photography, Video, Influencer, Dancer, Musician
   - **Location**: Where the gig takes place
   - **Date**: When talent is needed
   - **Compensation**: Pay range or rate
   - **Requirements**: Age range, experience, special skills
   - **Additional Info**: Wardrobe, travel, duration, etc.

2. **Upload Featured Image**
   - Represents the gig in listings
   - Helps attract right talent
   - Optional but recommended

3. **Set Status**
   - **Active**: Visible to talent, accepting applications
   - **Draft**: Save for later, not visible
   - **Closed**: No longer accepting applications

4. **Publish**
   - Review all details
   - Click "Post Gig"
   - Confirmation page with success message
   - Gig goes live immediately

**What Happens Next:**
- Gig appears in talent gig browse page
- Talent can view details and apply
- You receive notifications for new applications
- Track applications in your dashboard

#### Workflow 2: Reviewing Applications

**Location**: `/client/applications`

**The Review Interface:**

**Tabs:**
- **New**: Applications awaiting your review
- **Accepted**: Applications you've approved (pending booking)
- **Rejected**: Applications you've declined

**For Each Application:**

**What You See:**
- Talent name and profile photo
- Application date
- Cover letter/message
- Link to full talent profile
- Portfolio preview (if available)

**Quick Actions:**
- 👁️ **View Details**: See full application and talent profile
- ✅ **Accept**: Move forward with this talent
- ❌ **Reject**: Decline the application

**Review Process:**

1. **Click "View Details"**
   - Opens talent profile in side panel
   - See full portfolio
   - Read bio and experience
   - Check ratings from other clients
   - Review physical attributes and skills

2. **Make Decision**
   - **Accept**:
     - Opens "Accept Application" dialog
     - Option to add personal message
     - Creates booking automatically
     - Sends notification to talent
   - **Reject**:
     - Opens "Reject Application" dialog
     - Option to add feedback (optional)
     - Updates status
     - Sends notification to talent

3. **Booking Creation** (on Accept)
   - Automatic booking record created
   - Status: "Pending confirmation"
   - Both parties receive confirmation email
   - Booking appears in both dashboards

#### Workflow 3: Managing Bookings

**Location**: `/client/bookings`

**What You Can Do:**

**View All Bookings:**
- Upcoming bookings with dates
- Past bookings for reference
- Filter by status, date, gig

**Booking Details:**
- Talent information
- Contact details (phone, email)
- Gig details
- Booking status
- Payment information

**Actions:**
- **Confirm Booking**: Finalize the arrangement
- **Cancel Booking**: Cancel if plans change (with notice)
- **Message Talent**: Communicate details
- **Rate Talent**: After gig completion

**Communication:**
- Send messages through platform
- Share additional details
- Coordinate logistics
- Confirm attendance

### 💡 What to Expect

**Positive Experiences:**
- ✅ Easy gig posting with templates
- ✅ Organized application review process
- ✅ Quick talent discovery
- ✅ Streamlined booking management
- ✅ Clear communication channels
- ✅ Quality talent pool

**Best Practices:**
- 📝 Write detailed, clear gig descriptions
- 💰 Offer competitive compensation
- ⏱️ Respond to applications promptly
- ⭐ Rate talent after gigs (helps community)
- 📸 Keep your company profile updated
- 🤝 Build relationships with good talent

---

## Admin User Experience

### 🎯 Purpose & Goals

As an **Admin user**, you:
- **Oversee Platform**: Monitor all activity and users
- **Ensure Quality**: Review users, gigs, and applications
- **Resolve Issues**: Handle disputes and problems
- **Maintain Standards**: Enforce platform policies
- **Analyze Performance**: Track metrics and growth

### 🚀 Admin Dashboard

**URL**: `/admin/dashboard`

**Visual Design:**
- Modern dark theme with gradients
- Animated elements and hover effects
- Real-time statistics
- Interactive data visualization

**Top Navigation:**
- Dashboard
- Applications
- Talent
- Gigs
- Notifications (with count badge)
- User menu (profile, settings, logout)

### 📊 Key Admin Sections

#### Section 1: Dashboard Overview

**Metrics Displayed:**

**User Stats:**
- 👥 Total Users (all roles)
- 🎭 Total Talent
- 🏢 Total Clients
- 📈 Growth rate

**Activity Stats:**
- 📝 Total Gigs Posted
- ✅ Active Gigs
- 🎯 Total Applications
- 📅 Bookings Created

**Financial Stats:**
- 💰 Total Platform Revenue
- 💵 Average Gig Value
- 📊 Booking Conversion Rate

**Recent Activity Feed:**
- New user signups
- Gigs posted
- Applications submitted
- Bookings created
- Real-time updates

#### Section 2: Applications Management

**URL**: `/admin/applications`

**Beautiful Interface:**
- Dark theme with gradient headers
- Status-based color coding
- Smooth animations
- Interactive hover effects

**Top Stats Bar:**
- 🆕 New Applications (green gradient badge)
- ✅ Approved (blue gradient badge)
- ❌ Rejected (red gradient badge)

**Tabs:**
1. **New** - Applications awaiting review
2. **Approved** - Accepted applications
3. **Rejected** - Declined applications

**Table View:**

**Columns:**
- Application ID (truncated)
- Gig ID (truncated)
- Talent ID (truncated)
- Applied Date
- Status (colored badge)
- Actions dropdown

**Actions Menu:**
- ✅ Approve Application
- ❌ Reject Application
- 👁️ View Details
- 📊 View Analytics

**Approve Dialog:**
- Talent name and gig title
- Option to add admin note
- Confirmation message
- Email notification sent

**Reject Dialog:**
- Reason for rejection (optional)
- Admin notes
- Confirmation
- Email notification sent

**Search & Filter:**
- Search by talent name, gig title
- Filter by status, date range
- Sort by date, status, gig

**Empty States:**
- Beautiful illustrations
- Clear messaging
- Call-to-action when applicable

#### Section 3: Talent Management

**URL**: `/admin/talent`

**What You Can Do:**

**View All Talent:**
- Sortable, filterable table
- Profile photos
- Key stats per talent
- Quick actions

**Talent Details:**
- Full profile information
- Portfolio gallery
- Application history
- Booking history
- Ratings and reviews
- Account status

**Actions:**
- **Verify Talent**: Mark as verified (blue checkmark)
- **Feature Talent**: Show on homepage
- **Suspend**: Temporarily disable account
- **Ban**: Permanently remove from platform
- **Edit Profile**: Admin corrections
- **View Analytics**: Performance metrics

**Bulk Actions:**
- Select multiple talent
- Bulk verify
- Bulk email
- Bulk status change

#### Section 4: Gigs Management

**URL**: `/admin/gigs`

**Gig Moderation:**

**All Gigs View:**
- Status: Active, Closed, Flagged
- Client information
- Application count
- Posted date
- Expiration date

**Actions:**
- **Approve Gig**: Allow public visibility
- **Flag Gig**: Mark for review
- **Close Gig**: Stop accepting applications
- **Delete Gig**: Remove entirely
- **Feature Gig**: Promote on homepage
- **Edit Gig**: Admin corrections

**Moderation Queue:**
- New gigs awaiting approval
- Flagged gigs needing review
- Quick approve/reject interface

### 💡 Admin Best Practices

**Quality Control:**
- ✅ Review new gigs for policy compliance
- ✅ Monitor talent profiles for authenticity
- ✅ Check applications for spam or abuse
- ✅ Verify business credentials for clients

**User Support:**
- 📧 Respond to support inquiries promptly
- 🤝 Resolve disputes fairly
- 📋 Document issues and resolutions
- 📞 Provide clear communication

**Platform Health:**
- 📊 Monitor key metrics daily
- 🐛 Address technical issues quickly
- 🔒 Ensure security and privacy
- 📈 Identify growth opportunities

---

## Key Features & Workflows

### 🎨 Portfolio Management

**Purpose**: Visual showcase of talent's work

**Features:**
- Multiple image upload
- Drag-and-drop reordering
- Set primary/featured image
- Add titles and descriptions
- Image optimization
- Lightbox gallery view
- Quick edit/delete

**User Experience:**
- Beautiful grid layout
- Smooth animations
- Hover effects with actions
- Mobile-responsive
- Fast loading with image optimization

### 📧 Notification System

**Email Notifications:**

**For Talent:**
- Application submitted confirmation
- Application status updates (accepted/rejected)
- New gig matches your profile
- Booking confirmed
- Booking reminder (24 hours before)
- Client messages

**For Career Builders:**
- New application received
- Booking confirmed by talent
- Booking reminder
- Talent messages
- Gig expires soon

**For Admins:**
- New user signups
- Flagged content
- Reported issues
- System alerts

**In-App Notifications:**
- Bell icon with count badge
- Dropdown notification center
- Mark as read functionality
- Direct links to relevant pages

### 🔍 Search & Discovery

**Gig Search (Talent):**
- Keyword search (title, description)
- Category filter
- Location filter
- Compensation range slider
- Date range filter
- Sort by: Date, compensation, relevance

**Talent Search (Clients):**
- Search by name, skills
- Filter by category
- Experience level filter
- Location proximity
- Rating filter
- Availability filter

### 📊 Analytics & Reporting

**Talent Analytics:**
- Profile view count
- Application conversion rate
- Booking success rate
- Average rating
- Earnings over time
- Top-performing gigs

**Client Analytics:**
- Gig performance (view/apply ratio)
- Average time to fill
- Talent quality scores
- Booking fulfillment rate
- Spending analysis

**Admin Analytics:**
- Platform growth metrics
- User acquisition channels
- Engagement statistics
- Revenue tracking
- Churn analysis
- Feature usage

### 🔐 Security & Privacy

**Authentication:**
- Email/password with verification
- Secure password requirements
- Password reset flow
- Session management
- Auto-logout after inactivity

**Data Privacy:**
- GDPR compliant
- Data encryption at rest and in transit
- Minimal PII collection
- User data export
- Right to deletion
- Clear privacy policy

**Row-Level Security (RLS):**
- Database-level access control
- Users only see their own data
- Admins have elevated permissions
- Secure API endpoints
- SQL injection prevention

### 💳 Payment System (Future)

**Planned Features:**
- Stripe integration
- Secure payment processing
- Platform fee collection
- Talent payouts
- Invoice generation
- Transaction history
- Tax documentation

---

## Technical Implementation

### Database Schema

**Core Tables:**

**profiles**
- User identity and role
- Basic contact information
- Avatar and display name
- Created/updated timestamps

**talent_profiles**
- Extended talent information
- Physical attributes
- Experience and categories
- Bio and social links

**client_profiles**
- Company information
- Industry and verification
- Contact details

**gigs**
- Opportunity details
- Posted by client
- Status (active/closed)
- Compensation and location

**applications**
- Talent applying to gig
- Status (new/accepted/rejected)
- Cover letter message
- Application timestamp

**bookings**
- Confirmed talent-gig pairing
- Booking status
- Created from accepted applications

**portfolio_items**
- Talent photos
- Order and primary flag
- Image URLs and metadata

### API Routes

**Authentication:**
- POST `/api/auth/signup` - Create account
- POST `/api/auth/login` - Sign in
- POST `/api/auth/logout` - Sign out
- POST `/api/auth/reset-password` - Password reset

**Gigs:**
- GET `/api/gigs` - List gigs (with filters)
- GET `/api/gigs/[id]` - Gig details
- POST `/api/gigs` - Create gig (client)
- PATCH `/api/gigs/[id]` - Update gig
- DELETE `/api/gigs/[id]` - Delete gig

**Applications:**
- POST `/api/applications` - Submit application
- GET `/api/applications/talent` - Talent's applications
- GET `/api/applications/client` - Client's received applications
- PATCH `/api/applications/[id]` - Update status

**Bookings:**
- GET `/api/bookings/talent` - Talent's bookings
- GET `/api/bookings/client` - Client's bookings
- POST `/api/bookings` - Create booking
- PATCH `/api/bookings/[id]` - Update status

### Real-time Features

**Supabase Real-time:**
- Application status changes
- New application notifications
- Booking confirmations
- Message notifications

**Optimistic Updates:**
- Instant UI feedback
- Background data sync
- Error rollback

### Performance Optimization

**Image Optimization:**
- Next.js Image component
- Automatic WebP conversion
- Responsive image sizes
- Lazy loading

**Database Optimization:**
- Indexed columns for fast queries
- Optimized RLS policies
- Connection pooling
- Query caching

**Code Splitting:**
- Route-based splitting
- Dynamic imports
- Lazy component loading

---

## Conclusion

TOTL Agency provides a comprehensive, modern platform for talent booking and management. With distinct experiences for Talent, Clients, and Admins, the platform ensures:

✅ **Efficiency** - Streamlined workflows and automation
✅ **Transparency** - Clear communication and expectations
✅ **Quality** - Curated talent and verified clients
✅ **Security** - Enterprise-grade data protection
✅ **Scale** - Built to handle growth

The platform continues to evolve with user feedback and market needs, always focused on connecting exceptional talent with outstanding opportunities.

---

**Version**: 1.0
**Last Updated**: October 17, 2025
**Maintained By**: TOTL Agency Development Team

