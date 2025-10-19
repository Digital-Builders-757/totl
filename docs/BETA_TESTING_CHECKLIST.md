# TOTL Agency - Beta Testing Checklist

**Date:** October 19, 2025  
**Version:** MVP v0.97  
**Tester:** Manual Beta Testing

---

## 🎯 Testing Overview

This checklist covers all major features and workflows in TOTL Agency. Test each item systematically and note any issues.

**Base URL:** `http://localhost:3001` (or production: `https://www.thetotlagency.com`)

---

## ✅ Test Checklist

### **1. Homepage & Navigation** 🏠

- [ ] **Homepage loads** (`/`)
  - [ ] Video background plays
  - [ ] Hero section displays correctly
  - [ ] "Find Gigs" and "Apply as Talent" buttons visible
  - [ ] Stats section shows numbers
  - [ ] How It Works section displays
  - [ ] Footer displays with all links

- [ ] **Navbar works**
  - [ ] Logo links to homepage
  - [ ] Gigs link works (`/gigs`)
  - [ ] Talent link works (`/talent`)
  - [ ] About link works (`/about`)
  - [ ] Sign In button visible when logged out

- [ ] **Footer links** ⭐ NEW
  - [ ] Terms of Service link works (`/terms`)
  - [ ] Privacy Policy link works (`/privacy`)
  - [ ] Both legal pages have dark theme
  - [ ] Legal page content is readable and complete

---

### **2. Legal Pages** ⚖️ NEW - PRIORITY TEST

- [ ] **Terms of Service** (`/terms`)
  - [ ] Page loads with dark theme
  - [ ] All 20 sections display correctly
  - [ ] Glass morphism card styling works
  - [ ] Text is readable (white on black)
  - [ ] No layout issues on mobile
  - [ ] Contact email links are present

- [ ] **Privacy Policy** (`/privacy`)
  - [ ] Page loads with dark theme
  - [ ] All 15 sections display correctly
  - [ ] CCPA section present (California users)
  - [ ] GDPR section present (European users)
  - [ ] Third-party services listed
  - [ ] Contact information present
  - [ ] Mobile-responsive layout

---

### **3. Authentication** 🔐

- [ ] **Sign Up Flow**
  - [ ] Navigate to `/login`
  - [ ] Click "Sign Up" or "Create Account"
  - [ ] Choose role (Talent or Client)
  - [ ] Fill in registration form
  - [ ] Submit and verify redirect to onboarding/dashboard
  - [ ] Check email for verification email (Supabase Auth)

- [ ] **Login Flow**
  - [ ] Navigate to `/login`
  - [ ] Enter credentials
  - [ ] Submit and verify redirect to correct dashboard
  - [ ] Talent → `/talent/dashboard`
  - [ ] Client → `/client/dashboard`

- [ ] **Sign Out**
  - [ ] Click user dropdown in navbar
  - [ ] Click "Sign Out"
  - [ ] Verify redirect to homepage/login
  - [ ] Verify can't access protected pages

---

### **4. Gigs Browsing & Search** 🔍

- [ ] **Gigs Page** (`/gigs`)
  - [ ] All active gigs display in grid
  - [ ] Each gig card shows: title, category, location, compensation, date
  - [ ] Hover effects work on cards
  - [ ] "View Details" button appears on hover
  - [ ] Page displays "Showing X–Y of Z"

- [ ] **Search & Filtering** ⭐ FIXED TODAY
  - [ ] Keyword search works (try "NYC")
  - [ ] Category filter works (try "commercial")
  - [ ] Location filter works (try "New York")
  - [ ] Compensation filter works
  - [ ] Combined filters work
  - [ ] "Search" button submits form

- [ ] **Pagination** ⭐ FIXED TODAY
  - [ ] Page 1 displays correctly
  - [ ] Click "Next" button
  - [ ] Page 2 loads without 416 error
  - [ ] Try `/gigs?page=999` - should handle gracefully
  - [ ] "Previous" button works
  - [ ] Filters persist across pages

---

### **5. Gig Details & Application** 🎬

- [ ] **Gig Detail Page** (`/gigs/[id]`)
  - [ ] Click on any gig card
  - [ ] Gig details page loads
  - [ ] All information displays: title, description, location, date, compensation
  - [ ] Category badge shows
  - [ ] Image displays (or placeholder if none)
  - [ ] "Apply Now" button visible (when logged in as talent)

- [ ] **Application Submission** (Talent only)
  - [ ] Click "Apply Now"
  - [ ] Application form displays
  - [ ] Can type cover letter/message
  - [ ] Submit application
  - [ ] Verify redirect to `/talent/dashboard?applied=success`
  - [ ] **Check email for "Application Received" confirmation** ⭐ NEW
  - [ ] Application appears in talent dashboard

---

### **6. Email Notifications** 📧 NEW - PRIORITY TEST

**Note:** Use a real email address you can check

- [ ] **Application Submitted** (Talent receives)
  - [ ] Apply to a gig
  - [ ] Check email inbox
  - [ ] Verify "Application Received" email arrived
  - [ ] Email has TOTL branding
  - [ ] Dashboard link in email works
  - [ ] Email is mobile-responsive

- [ ] **New Application Alert** (Client receives)
  - [ ] (As client) Check email after talent applies
  - [ ] Verify "New Application" email arrived
  - [ ] Contains gig title
  - [ ] Dashboard link works

- [ ] **Application Accepted** (Talent receives)
  - [ ] (As client) Accept an application
  - [ ] Check talent's email
  - [ ] Verify "Application Accepted" email arrived
  - [ ] Congratulatory tone
  - [ ] Client name displayed
  - [ ] Dashboard link works

- [ ] **Booking Confirmed** (Talent receives)
  - [ ] (Sent automatically when application accepted)
  - [ ] Verify "Booking Confirmed" email arrived
  - [ ] Booking details present (date, location, compensation)
  - [ ] Preparation checklist included
  - [ ] Professional design

- [ ] **Application Rejected** (Talent receives)
  - [ ] (As client) Reject an application
  - [ ] Check talent's email
  - [ ] Verify "Application Rejected" email arrived
  - [ ] Empathetic, professional tone
  - [ ] Encourages continuing to apply
  - [ ] "Browse More Gigs" link works

---

### **7. Talent Dashboard** 👤

- [ ] **Dashboard Overview** (`/talent/dashboard`)
  - [ ] Stats cards display (applications, bookings, etc.)
  - [ ] Recent applications section shows
  - [ ] Recent bookings section shows
  - [ ] Dark theme throughout
  - [ ] Avatar displays in header

- [ ] **Applications Tab**
  - [ ] All applications listed
  - [ ] Status badges show (new, accepted, rejected)
  - [ ] Click "View Details" on application
  - [ ] Application details modal opens
  - [ ] Gig information displays in modal
  - [ ] Can close modal

- [ ] **Bookings Tab**
  - [ ] All bookings listed
  - [ ] Status filters work (pending, confirmed, completed)
  - [ ] Booking cards show all details
  - [ ] Date, location, compensation visible

---

### **8. Client Dashboard** 💼

- [ ] **Dashboard Overview** (`/client/dashboard`)
  - [ ] Stats cards display
  - [ ] Posted gigs section shows
  - [ ] Recent applications section shows
  - [ ] Dark theme throughout
  - [ ] Avatar displays

- [ ] **Applications Review**
  - [ ] Navigate to Applications tab
  - [ ] All applications for client's gigs show
  - [ ] Can filter by status (new, accepted, rejected)
  - [ ] Click "Accept" on an application
  - [ ] Accept dialog opens
  - [ ] Fill in booking details (date, compensation, notes)
  - [ ] Submit acceptance
  - [ ] **Verify talent receives 2 emails** ⭐ NEW
  - [ ] Booking created successfully
  - [ ] Application status updates to "accepted"

- [ ] **Reject Application**
  - [ ] Click "Reject" on an application
  - [ ] Confirm rejection
  - [ ] **Verify talent receives rejection email** ⭐ NEW
  - [ ] Application status updates to "rejected"

- [ ] **Gigs Management**
  - [ ] View posted gigs
  - [ ] Can edit gig details
  - [ ] Can see application count per gig

---

### **9. Profile Settings** ⚙️

**Talent Profile:**
- [ ] Navigate to Settings (`/settings`)
- [ ] Personal Info tab works
  - [ ] Can edit first name, last name
  - [ ] Can edit contact info
  - [ ] Can edit bio
  - [ ] Save changes
  
- [ ] Measurements tab works
  - [ ] Can edit height, weight
  - [ ] Can edit chest, waist, hips
  - [ ] Can edit shoe size
  - [ ] Save changes

- [ ] Experience tab works
  - [ ] Can edit years of experience
  - [ ] Can add skills/specialties
  - [ ] Save changes

- [ ] Avatar Upload
  - [ ] Click avatar or "Change Avatar"
  - [ ] Upload image file
  - [ ] Preview displays
  - [ ] Save and verify avatar shows everywhere

- [ ] **Portfolio Gallery** 🎨
  - [ ] Navigate to Portfolio tab
  - [ ] Click "Upload Images"
  - [ ] Select multiple images (2-3)
  - [ ] Images upload successfully
  - [ ] Can drag to reorder images
  - [ ] Can set primary/featured image
  - [ ] Can edit title/caption inline
  - [ ] Can delete image with confirmation
  - [ ] Images display in grid layout

**Client Profile:**
- [ ] Navigate to Settings
- [ ] Can edit company name
- [ ] Can edit industry
- [ ] Can edit contact info
- [ ] Avatar upload works
- [ ] Save changes

---

### **10. About Page** ℹ️

- [ ] Navigate to `/about`
- [ ] Page loads with dark theme
- [ ] Video background works
- [ ] Content sections display
- [ ] Matches homepage aesthetic
- [ ] Responsive on mobile

---

### **11. Mobile Responsiveness** 📱

Test on mobile view (resize browser to 375px width):

- [ ] Homepage mobile layout works
- [ ] Navbar hamburger menu works
- [ ] Gigs grid stacks to 1 column
- [ ] Application forms are usable
- [ ] Dashboard cards stack properly
- [ ] Legal pages are readable
- [ ] All buttons are tappable (not too small)

---

### **12. Error Handling** 🐛

- [ ] Try accessing protected route while logged out
  - [ ] Redirects to login with returnUrl
  
- [ ] Try accessing talent dashboard as client
  - [ ] Shows appropriate error or redirects

- [ ] Try applying to same gig twice
  - [ ] Shows "already applied" error

- [ ] Try invalid gig ID (`/gigs/invalid-id`)
  - [ ] Shows 404 or not found page

- [ ] Check browser console
  - [ ] No critical errors
  - [ ] No hydration warnings
  - [ ] Only expected warnings (Sentry debug, etc.)

---

### **13. Performance** ⚡

- [ ] **Page Load Times**
  - [ ] Homepage loads in <3 seconds
  - [ ] Gigs page loads in <3 seconds
  - [ ] Dashboard loads in <3 seconds
  - [ ] Legal pages load in <2 seconds

- [ ] **Interactions**
  - [ ] Form submissions feel snappy
  - [ ] Navigation is instant
  - [ ] Images load progressively
  - [ ] No laggy animations

---

## 🐛 Bug Tracking

**Use this section to note any issues found:**

### High Priority Bugs
- [ ] Bug 1: _______________________________________________
- [ ] Bug 2: _______________________________________________

### Medium Priority Issues  
- [ ] Issue 1: _______________________________________________
- [ ] Issue 2: _______________________________________________

### Low Priority / Nice-to-Have
- [ ] Enhancement 1: _______________________________________________
- [ ] Enhancement 2: _______________________________________________

---

## 📊 Test Results Summary

**Date Tested:** __________________  
**Tester:** __________________  
**Environment:** □ Development  □ Production

**Overall Status:**
- Total Tests: 100+
- Passed: _____ / _____
- Failed: _____ / _____
- Blocked: _____ / _____

**Critical Bugs Found:** _____  
**Medium Bugs Found:** _____  
**Minor Issues Found:** _____

**Recommendation:**
- [ ] ✅ Ready for production launch
- [ ] ⚠️ Minor fixes needed before launch
- [ ] 🚫 Critical issues must be fixed first

---

## 🎯 Priority Test Areas (NEW TODAY)

These features were just built and need extra attention:

### **High Priority:**
1. ✅ **Gigs Pagination** - Test page 2, page 999, edge cases
2. ✅ **Email Notifications** - Verify all 5 email types send correctly
3. ✅ **Legal Pages** - Check Terms and Privacy display properly

### **Medium Priority:**
4. Portfolio gallery (built last session)
5. Application acceptance flow
6. Booking creation

### **Low Priority:**
7. Profile settings
8. About page
9. Mobile responsiveness

---

## 🚀 Quick Test Script

**For rapid testing, run through this 15-minute flow:**

1. **Homepage** → Click around, check footer links
2. **Legal Pages** → Open `/terms` and `/privacy`, verify readable
3. **Gigs** → Browse, filter, try pagination
4. **Login** → Sign in as talent
5. **Apply** → Submit application to a gig
6. **Check Email** → Verify "Application Received" email
7. **Logout** → Sign out
8. **Login as Client** → Different user
9. **Review Application** → Go to dashboard, find application
10. **Accept Application** → Create booking
11. **Check Email** → Verify talent got 2 emails (accepted + booking)
12. **Settings** → Upload avatar, edit profile
13. **Portfolio** → Upload 2-3 images, reorder them
14. **Check Console** → No critical errors
15. **Mobile View** → Resize browser, check responsiveness

---

**Expected Time:** 15-30 minutes for full testing  
**Critical Features:** All working ✅  
**Known Issues:** Document any new bugs found


