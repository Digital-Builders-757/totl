# Talent Account Creation Form Documentation

## Overview

The Talent Account Creation Form is a comprehensive multi-step form that allows potential talent to apply to join the TOTL Agency platform. The form collects essential user information, validates it, and creates a new talent account in the system.

## Form Structure

The form is divided into three steps:

1. **Account Information**
   - First Name (required)
   - Last Name (required)
   - Email Address (required)
   - Password (required)
   - Confirm Password (required)
   - Terms of Service Agreement (required)
   - Marketing Preferences (optional)

2. **Personal Information**
   - Phone Number (required)
   - Age (required)
   - Location (required)
   - Height (optional)
   - Measurements (optional)
   - Hair Color (optional)
   - Eye Color (optional)
   - Shoe Size (optional)
   - Languages (optional)
   - Instagram Handle (optional)

3. **Professional Information**
   - Modeling Experience (required)
   - Portfolio Link (optional)

## Form Features

### Multi-step Navigation
- Progress indicator showing completion percentage
- Step indicator showing current step
- Next/Previous buttons for navigation between steps
- Form validation at each step before proceeding

### Password Strength Indicator
- Visual indicator of password strength
- Classification: Weak, Medium, Strong, Very Strong
- Requirements: minimum 8 characters, uppercase, lowercase, numbers, special characters

### Form Validation
- Client-side validation for all fields
- Specific validation rules for:
  - Email format
  - Password strength and matching
  - Age range (16-100)
  - Phone number format
  - Height format
  - Instagram handle format

### User Experience Enhancements
- Tooltips for fields that need explanation
- Clear error messages
- Visual feedback for form progress
- Responsive design for all device sizes

## Integration with Backend

### Supabase Authentication
The form integrates with Supabase Authentication to:
1. Create a new user account with email and password
2. Set the user role as "talent"
3. Send a verification email to the user

### Database Integration
Upon successful form submission, the following records are created:
1. A user record in Supabase Auth
2. A profile record in the `profiles` table with:
   - User ID
   - Role (talent)
   - First Name
   - Last Name
   - Display Name
   - Email Verification Status

3. A talent profile record in the `talent_profiles` table with:
   - User ID
   - First Name
   - Last Name
   - Phone
   - Age
   - Location
   - Experience
   - Portfolio URL (if provided)
   - Height (if provided)
   - Measurements (if provided)
   - Hair Color (if provided)
   - Eye Color (if provided)
   - Shoe Size (if provided)
   - Languages
   - Instagram Handle (if provided)
   - Marketing Preferences

## Form Submission Flow

1. User completes all three steps of the form
2. Final validation is performed on all fields
3. Form submission is initiated
4. User account is created in Supabase Auth
5. Profile and talent profile records are created in the database
6. Verification email is sent to the user
7. User is redirected to the verification pending page

## Error Handling

The form includes comprehensive error handling for:
- Form validation errors
- Duplicate email addresses
- Authentication errors
- Database errors
- Network errors

## Security Considerations

- Password strength requirements
- Email verification requirement
- Secure form submission
- Input sanitization
- CSRF protection (handled by Next.js)

## Accessibility Features

- Proper label associations
- Error messages linked to form fields
- Keyboard navigation support
- Screen reader friendly markup
- Sufficient color contrast

## Usage

The Talent Account Creation Form is accessed via:
1. The "Apply as Talent" button in the navigation
2. The "Join as Talent" button on the choose role page
3. The "Get Discovered (Talent)" button on the homepage

## Testing

The form has been tested for:
- Validation of all fields
- Multi-step navigation
- Form submission
- Error handling
- Responsive design
- Cross-browser compatibility
- Accessibility compliance
\`\`\`

Let's update the homepage to include the "Apply as Talent" button in the navigation:
