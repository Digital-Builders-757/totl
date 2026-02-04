# 🎨 TOTL Agency - Complete Design System Breakdown

**Last Updated:** February 4, 2026  
**Status:** Comprehensive Reference Document  
**Purpose:** End-to-end design system documentation for UX improvements and product stickiness analysis

---

## 📋 Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Mobile vs Desktop](#mobile-vs-desktop)
7. [Animations & Interactions](#animations--interactions)
8. [Premium Effects](#premium-effects)
9. [User Flows & Navigation](#user-flows--navigation)
10. [Dashboard Patterns](#dashboard-patterns)
11. [Form Patterns](#form-patterns)
12. [Status & Badge System](#status--badge-system)
13. [Loading & Empty States](#loading--empty-states)
14. [Accessibility](#accessibility)

---

## 🎯 Design Philosophy

### Core Aesthetic: **Back-Lit Minimalism**

TOTL Agency uses a **premium, dark-mode-first design system** inspired by Apple's design language:

- **Deep Charcoal Foundation**: Ultra-dark backgrounds (12% lightness) with cool undertones
- **Pure White Accents**: High-contrast white text and UI elements for maximum readability
- **Frosted Glass Effects**: Translucent panels with backdrop blur for depth
- **Subtle Glows**: Soft white glows on interactive elements
- **Grain Texture**: Subtle film grain overlay for premium feel
- **OKLCH Color Space**: Modern, perceptually uniform colors with wide-gamut support

### Design Principles

1. **Mobile-First**: All layouts start mobile, then enhance for desktop
2. **Touch-Optimized**: Minimum 44x44px touch targets (Apple guideline)
3. **Accessibility-First**: WCAG AA compliant, reduced motion support
4. **Performance-Conscious**: Hardware-accelerated animations, optimized images
5. **Consistent Spacing**: 4px base unit, predictable rhythm throughout

---

## 🎨 Color System

### OKLCH Color Palette (Primary System)

TOTL uses **OKLCH** (OK Lightness Chroma Hue) for perceptually uniform colors:

#### Base Neutrals
```css
--oklch-bg: oklch(12% 0.02 258)              /* Deep charcoal foundation */
--oklch-panel: oklch(18% 0.02 258)            /* Elevated panels */
--oklch-panel-alpha: oklch(18% 0.02 258 / 0.6) /* Semi-transparent panels */
--oklch-surface: oklch(22% 0.02 258)         /* Interactive surfaces */
```

#### Text Hierarchy
```css
--oklch-text-primary: oklch(98% 0 0)         /* Pure white - main text */
--oklch-text-secondary: oklch(90% 0.01 258)  /* Light gray - secondary */
--oklch-text-tertiary: oklch(80% 0.02 258)   /* Medium gray - tertiary */
--oklch-text-muted: oklch(65% 0.02 258)     /* Darker gray - muted */
```

#### Brand "Back-Light" Ramp (Pure White Glow)
```css
--oklch-brand-1: oklch(85% 0.02 258)         /* Soft white */
--oklch-brand-2: oklch(92% 0.01 258)         /* Bright white */
--oklch-brand-3: oklch(98% 0 0)             /* Pure white glow (primary) */
--oklch-brand-4: oklch(75% 0.03 258)         /* Muted white (hover) */
```

#### Semantic Status Colors
```css
--oklch-success: oklch(70% 0.22 145)         /* Success green */
--oklch-warning: oklch(75% 0.20 75)          /* Warning amber */
--oklch-error: oklch(68% 0.25 25)            /* Error red */
--oklch-info: oklch(72% 0.20 220)            /* Info blue */
```

#### Application Status Colors (Badges)
```css
--oklch-status-new: oklch(72% 0.24 260)      /* Blue - New */
--oklch-status-review: oklch(75% 0.20 75)    /* Amber - Under Review */
--oklch-status-shortlist: oklch(68% 0.22 280) /* Purple - Shortlisted */
--oklch-status-accepted: oklch(70% 0.22 145) /* Green - Accepted */
--oklch-status-rejected: oklch(68% 0.25 25)  /* Red - Rejected */
```

### HSL Tokens (Legacy/Backward Compatible)

For components using shadcn/ui:

```css
--background: 0 0% 0%                        /* Pure black */
--foreground: 0 0% 98%                       /* Near white */
--primary: 0 0% 100%                         /* Pure white */
--secondary: 0 0% 6%                         /* Very dark gray */
--muted: 0 0% 4%                            /* Dark gray */
--accent: 0 0% 8%                           /* Slightly lighter gray */
--destructive: 0 84.2% 60.2%                /* Red for errors */
--border: 0 0% 12%                          /* Subtle borders */
--ring: 0 0% 100%                           /* Focus ring (white) */
```

### Border Radius

```css
--radius: 1rem (16px)                        /* Base radius */
--radius-lg: 1.5rem (24px)                   /* Large radius (cards) */
--radius-md: calc(var(--radius) - 2px)       /* Medium radius */
--radius-sm: calc(var(--radius) - 4px)       /* Small radius */
```

---

## 📝 Typography

### Font Families

```css
font-family: "Inter", "system-ui", "sans-serif"     /* Body text */
font-family: "Cal Sans", "Inter", "system-ui"       /* Display headings */
```

### Type Scale

#### Headings
- **H1**: `text-2xl sm:text-3xl` (1.875rem → 1.875rem/2.25rem)
  - Font weight: `700` (bold)
  - Letter spacing: `-0.04em`
  - Line height: `tight`

- **H2**: `text-xl sm:text-2xl` (1.25rem → 1.5rem/1.875rem)
  - Font weight: `600` (semibold)
  - Letter spacing: `-0.025em`

- **H3**: `text-lg sm:text-xl` (1.125rem → 1.25rem)
  - Font weight: `600` (semibold)

#### Body Text
- **Base**: `text-sm sm:text-base` (0.875rem → 1rem)
  - Line height: `1.5` (default)
  - Color: `var(--oklch-text-primary)`

- **Secondary**: `text-sm` (0.875rem)
  - Color: `var(--oklch-text-secondary)`

- **Muted**: `text-sm` (0.875rem)
  - Color: `var(--oklch-text-muted)`

#### Labels
- **Small Labels**: `text-xs uppercase tracking-wide`
  - Font size: `0.75rem` (12px)
  - Letter spacing: `0.05em`
  - Text transform: `uppercase`

### Typography Utilities

- **Text Balance**: `.text-balance` - Prevents orphaned words
- **Line Clamp**: `.line-clamp-1`, `.line-clamp-2`, `.line-clamp-3` - Multi-line truncation
- **Text Gradient**: `.text-gradient-glow` - Gradient text effect

---

## 📐 Spacing & Layout

### Base Unit
**4px** - All spacing uses multiples of 4px

### Spacing Scale (Tailwind)

```
0.5rem = 8px   (spacing-2)
1rem = 16px    (spacing-4)
1.5rem = 24px  (spacing-6)
2rem = 32px    (spacing-8)
2.5rem = 40px  (spacing-10)
3rem = 48px    (spacing-12)
4rem = 64px    (spacing-16)
```

### Layout Patterns

#### Page Container
```css
.container {
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;    /* px-4 */
  padding-right: 1rem;  /* px-4 */
}

@media (min-width: 640px) {
  padding-left: 1.5rem;  /* sm:px-6 */
  padding-right: 1.5rem;
}

@media (min-width: 1024px) {
  padding-left: 2rem;    /* lg:px-8 */
  padding-right: 2rem;
}
```

#### Page Shell (Standard Layout)
```tsx
<PageShell topPadding={true}>
  {/* Content */}
</PageShell>
```

**Spacing:**
- Top padding: `pt-20 sm:pt-24` (matches navbar height)
- Container padding: `px-4 sm:px-6 lg:px-8`
- Vertical padding: `py-6 sm:py-10`
- Section gaps: `space-y-6`

#### Section Cards
```tsx
<SectionCard paddingClassName="p-4 sm:p-6">
  {/* Content */}
</SectionCard>
```

**Default Padding:**
- Mobile: `p-4` (16px)
- Desktop: `sm:p-6` (24px)

### Grid Systems

#### Responsive Grid
```css
/* Mobile: 1 column */
grid-cols-1

/* Tablet: 2 columns */
md:grid-cols-2

/* Desktop: 3 columns */
lg:grid-cols-3
```

#### Gap Spacing
- Small: `gap-4` (16px)
- Medium: `gap-6` (24px)
- Large: `gap-8` (32px)

---

## 🧩 Components

### Buttons

#### Variants

**1. Default (Primary)**
```tsx
<Button variant="default">
  Primary Action
</Button>
```
- Background: `bg-primary` (white)
- Text: `text-primary-foreground` (black)
- Hover: `hover:bg-primary/90`
- Active: `active:scale-[0.98]`
- Size: `h-10 px-4 py-2`

**2. Destructive**
```tsx
<Button variant="destructive">
  Delete
</Button>
```
- Background: `bg-destructive` (red)
- Text: `text-destructive-foreground` (white)

**3. Outline**
```tsx
<Button variant="outline">
  Secondary Action
</Button>
```
- Border: `border border-input`
- Background: `bg-background`
- Hover: `hover:bg-accent`

**4. Secondary**
```tsx
<Button variant="secondary">
  Secondary
</Button>
```
- Background: `bg-secondary` (dark gray)
- Text: `text-secondary-foreground`

**5. Ghost**
```tsx
<Button variant="ghost">
  Ghost Button
</Button>
```
- Transparent background
- Hover: `hover:bg-accent`

**6. Link**
```tsx
<Button variant="link">
  Link Button
</Button>
```
- Text with underline on hover

**7. Success**
```tsx
<Button variant="success">
  Success
</Button>
```
- Background: `bg-green-600`
- Hover: `hover:bg-green-700`

#### Sizes

- **Small**: `h-9 px-3` (36px height)
- **Default**: `h-10 px-4` (40px height)
- **Large**: `h-11 px-8` (44px height)
- **Icon**: `h-10 w-10` (40x40px square)

#### States

**Loading State:**
```tsx
<Button loading={true} loadingText="Saving...">
  Save
</Button>
```
- Shows spinner icon
- Displays `loadingText` or original children
- Button disabled while loading

**Success State:**
```tsx
<Button success={true}>
  Saved
</Button>
```
- Shows checkmark icon
- Button disabled in success state

#### Premium Button (Custom Class)
```css
.button-glow {
  background: var(--oklch-brand-3);  /* Pure white */
  color: var(--oklch-bg);            /* Black text */
  font-weight: 600;
  border-radius: 1rem;
  padding: 0.75rem 1.5rem;
  box-shadow: 
    0 0 0 1px oklch(100% 0 0 / 0.1) inset,
    0 8px 24px oklch(98% 0 0 / 0.25),
    0 0 60px oklch(98% 0 0 / 0.15);
}

.button-glow:hover {
  transform: translateY(-1px);
  box-shadow: 
    0 0 0 1px oklch(100% 0 0 / 0.15) inset,
    0 12px 32px oklch(98% 0 0 / 0.35),
    0 0 80px oklch(98% 0 0 / 0.25);
}
```

### Cards

#### Standard Card (shadcn/ui)
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
  <CardFooter>
    Actions
  </CardFooter>
</Card>
```

**Styling:**
- Background: `bg-card`
- Border: `border` (subtle)
- Border radius: `rounded-lg` (0.5rem)
- Shadow: `shadow-sm`
- Padding: `p-6` (24px)

#### Premium Section Card
```tsx
<SectionCard>
  {/* Content */}
</SectionCard>
```

**Styling:**
- Uses `panel-frosted` + `card-backlit` classes
- Border radius: `rounded-2xl` (1.5rem)
- Border: `border border-white/10`
- Padding: `p-4 sm:p-6` (mobile-first)
- Hover: Lifts up 4px with enhanced glow

**Classes Applied:**
```css
.panel-frosted {
  background: var(--oklch-panel-alpha);  /* Semi-transparent */
  backdrop-filter: blur(20px);
  border: 1px solid var(--oklch-border-alpha);
  border-radius: 1.5rem;
  box-shadow: 
    0 0 0 1px oklch(98% 0 0 / 0.04) inset,
    0 10px 30px oklch(0% 0 0 / 0.35);
}

.card-backlit {
  background: var(--oklch-panel);
  border-radius: 1.5rem;
  border: 1px solid var(--oklch-border-alpha);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 0 0 1px oklch(98% 0 0 / 0.05) inset,
    0 4px 20px oklch(0% 0 0 / 0.3);
}

.card-backlit:hover {
  transform: translateY(-4px);
  border-color: oklch(98% 0 0 / 0.12);
  box-shadow: 
    0 0 0 1px oklch(98% 0 0 / 0.1) inset,
    0 0 40px oklch(98% 0 0 / 0.15),
    0 20px 40px oklch(0% 0 0 / 0.4);
}
```

### Badges

#### Standard Badge
```tsx
<Badge variant="default">Default</Badge>
```

#### Status Badges
```tsx
<GigStatusBadge status="active" />
<ApplicationStatusBadge status="new" />
<BookingStatusBadge status="confirmed" />
<UserRoleBadge userRole="talent" />
```

**Gig Status Variants:**
- `draft`: Slate gray with transparency
- `active`: Green with glow
- `closed`: Red
- `completed`: Blue
- `featured`: Amber with shadow
- `urgent`: Orange with pulse animation

**Application Status Variants:**
- `new`: Purple with shadow
- `under_review`: Blue
- `shortlisted`: Cyan
- `rejected`: Red
- `accepted`: Green with shadow

**Badge Styling:**
```css
.badge {
  inline-flex items-center gap-1
  rounded-full
  border px-2.5 py-0.5
  text-xs font-semibold
  transition-all duration-200
}
```

**Badge Colors (with transparency):**
- Background: `bg-[color]/20` (20% opacity)
- Text: `text-[color]-300`
- Border: `border-[color]/30` (30% opacity)

### Inputs

#### Standard Input
```tsx
<Input type="text" placeholder="Enter text" />
```

**Styling:**
- Height: `h-10` (40px)
- Border radius: `rounded-md`
- Border: `border border-input`
- Background: `bg-background`
- Focus: White ring with glow
- Padding: `px-3 py-2`

**Focus State:**
```css
focus-visible:ring-2
focus-visible:ring-white/20
focus-visible:ring-offset-0
focus-visible:border-white/40
focus-visible:shadow-[0_0_15px_rgba(255,255,255,0.1)]
```

#### Floating Input (Premium)
```tsx
<FloatingInput
  label="Email"
  type="email"
  error={errors.email}
  success={isValid}
/>
```

**Features:**
- Floating label animation
- Validation icons (check/error)
- Error message display
- Shake animation on error
- Success state styling

**Label Animation:**
- Default: Centered vertically
- Focused/Value: Moves to top (`top-2 text-xs`)

**Validation States:**
- Error: Red border, shake animation, error icon
- Success: Green border, checkmark icon
- Default: Dark border

### Forms

#### Form Structure
```tsx
<Form>
  <FormField>
    <FormLabel>Label</FormLabel>
    <FormControl>
      <Input />
    </FormControl>
    <FormDescription>Helper text</FormDescription>
    <FormMessage>Error message</FormMessage>
  </FormField>
</Form>
```

**Form Spacing:**
- Field gap: `space-y-6`
- Label spacing: `space-y-1.5`
- Error message: `mt-1.5 text-xs text-red-400`

### Dialogs/Modals

#### Standard Dialog
```tsx
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button>Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Styling:**
- Max width: `max-w-lg`
- Background: `bg-background`
- Border: `border`
- Border radius: `sm:rounded-lg`
- Shadow: `shadow-lg`
- Animation: Fade in + scale + slide

**Overlay:**
- Background: `bg-black/80`
- Backdrop: Blur effect
- Animation: Fade in/out

### Tabs

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="applications">Applications</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    Content
  </TabsContent>
</Tabs>
```

**Styling:**
- List background: `bg-muted`
- Active tab: `bg-background` with shadow
- Border radius: `rounded-sm` for triggers
- Padding: `px-3 py-1.5`

### Avatars

```tsx
<Avatar>
  <AvatarImage src="/avatar.jpg" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

**Sizes:**
- Default: `h-10 w-10` (40px)
- Small: `h-8 w-8` (32px)
- Large: `h-12 w-12` (48px)

**Styling:**
- Border radius: `rounded-full`
- Background: `bg-muted`
- Fallback: User initials

---

## 📱 Mobile vs Desktop

### Breakpoint System

**Mobile Breakpoint:** `768px` (defined in `use-mobile.tsx`)

```tsx
const MOBILE_BREAKPOINT = 768;

// Mobile: < 768px
// Desktop: >= 768px
```

### Responsive Patterns

#### Mobile-First Approach
All styles start mobile, then enhance for larger screens:

```css
/* Mobile (default) */
.class {
  padding: 1rem;
  font-size: 0.875rem;
}

/* Tablet+ */
@media (min-width: 640px) {
  .class {
    padding: 1.5rem;
    font-size: 1rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .class {
    padding: 2rem;
  }
}
```

### Mobile-Specific Enhancements

#### Touch Targets
```css
@media (max-width: 768px) {
  button, a, input, select, textarea {
    min-height: 44px;  /* Apple guideline */
  }
}
```

#### Tap Feedback
```css
button:active, a:active {
  opacity: 0.8;
  transform: scale(0.98);
}
```

#### Input Font Size
```css
input[type="text"],
input[type="email"],
input[type="password"] {
  font-size: 16px;  /* Prevents iOS zoom on focus */
}
```

#### Text Sizing
```css
h1 { font-size: 1.75rem; }  /* Mobile */
h2 { font-size: 1.5rem; }
h3 { font-size: 1.25rem; }
```

#### Disable Hover on Touch
```css
@media (hover: none) and (pointer: coarse) {
  .hover-lift:hover {
    transform: none;
  }
}
```

### iOS Safe Areas

```css
@supports (padding: env(safe-area-inset-bottom)) {
  body {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
}
```

### Navigation Differences

#### Desktop Navbar
- Horizontal layout
- All links visible
- Dropdown menus on hover
- Command palette (Cmd+K)

#### Mobile Navbar
- Hamburger menu
- Full-screen overlay menu
- Stacked navigation links
- Touch-optimized spacing

### Layout Differences

#### Dashboard Layouts

**Desktop:**
- Multi-column grids
- Side-by-side cards
- Horizontal data tables
- Expanded navigation

**Mobile:**
- Single column
- Stacked cards
- Scrollable tables
- Collapsed navigation

---

## ✨ Animations & Interactions

### Animation Principles

1. **Duration**: 200-300ms for interactions, 500-800ms for entrances
2. **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design)
3. **Reduced Motion**: All animations respect `prefers-reduced-motion`

### Standard Animations

#### Fade In Up
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```
- Duration: `0.6s`
- Easing: `ease-out`
- Usage: Page entrances, card reveals

#### Fade In Scale
```css
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```
- Duration: `0.5s`
- Usage: Modal dialogs, popovers

#### Shimmer (Loading)
```css
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
```
- Duration: `1.5s infinite`
- Usage: Skeleton loaders

#### Pulse Glow
```css
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.1);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
}
```
- Duration: `2s infinite`
- Usage: Urgent badges, notifications

#### Shake (Error)
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
```
- Duration: `0.5s`
- Usage: Form validation errors

### Hover Effects

#### Lift Effect
```css
.hover-lift {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(255, 255, 255, 0.1);
}
```

#### Scale Effect
```css
.hover-scale:hover {
  transform: scale(1.02);
}
```

#### Glow Effect
```css
.hover-glow:hover {
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.15);
}
```

### Button Interactions

**Default State:**
- No transform
- Standard shadow

**Hover State:**
- `translateY(-1px)` or `translateY(-2px)`
- Enhanced shadow
- Slight scale increase

**Active State:**
- `scale(0.98)` or `translateY(0)`
- Immediate feedback

**Disabled State:**
- `opacity-50`
- `cursor-not-allowed`
- No hover effects

### Card Interactions

**Default:**
- Standard elevation
- Subtle border

**Hover:**
- `translateY(-4px)` lift
- Enhanced glow
- Border brightens

**Active/Tap:**
- `scale(0.98)`
- Immediate feedback

---

## 💎 Premium Effects

### Glassmorphism

#### Apple Glass Effect
```css
.apple-glass {
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
```

**Usage:**
- Navbar (when scrolled)
- Modal overlays
- Floating panels

### Frosted Glass Panel
```css
.panel-frosted {
  background: var(--oklch-panel-alpha);  /* 60% opacity */
  backdrop-filter: blur(20px);
  border: 1px solid var(--oklch-border-alpha);
  border-radius: 1.5rem;
  box-shadow: 
    0 0 0 1px oklch(98% 0 0 / 0.04) inset,
    0 10px 30px oklch(0% 0 0 / 0.35);
}
```

**Usage:**
- Section cards
- Dashboard panels
- Elevated surfaces

### Back-Lit Cards

```css
.card-backlit {
  background: var(--oklch-panel);
  border-radius: 1.5rem;
  border: 1px solid var(--oklch-border-alpha);
  box-shadow: 
    0 0 0 1px oklch(98% 0 0 / 0.05) inset,
    0 4px 20px oklch(0% 0 0 / 0.3);
}

.card-backlit:hover {
  transform: translateY(-4px);
  border-color: oklch(98% 0 0 / 0.12);
  box-shadow: 
    0 0 0 1px oklch(98% 0 0 / 0.1) inset,
    0 0 40px oklch(98% 0 0 / 0.15),  /* Outer glow */
    0 20px 40px oklch(0% 0 0 / 0.4);
}
```

**Features:**
- Inner glow (inset shadow)
- Outer bloom (hover)
- Smooth transitions
- Pure white glow

### Grain Texture

```css
.grain-texture::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,...");
  pointer-events: none;
  z-index: 1;
  opacity: 0.02;
}
```

**Usage:**
- Premium cards
- Elevated panels
- Adds subtle texture

### Text Gradient Glow

```css
.text-gradient-glow {
  background: linear-gradient(135deg, var(--oklch-brand-2), var(--oklch-brand-3));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**Usage:**
- Hero headings
- Premium CTAs
- Accent text

---

## 🧭 User Flows & Navigation

### Navigation Structure

#### Main Navbar

**Desktop:**
```
[Logo] [Gigs] [About] [Admin] [Subscribe Badge] [My Account ▼] [Sign In] [Create Account]
```

**Mobile:**
```
[Logo] [Subscribe] [☰]
```

**Mobile Menu:**
```
[Subscribe & Apply]
[Gigs]
[About]
─────────────────
[Apply to be Career Builder]
[Talent Dashboard]
[Subscription (Free)]
[Career Builder Dashboard]
[Profile Settings]
[Sign Out]
```

### Navigation Behavior

#### Scroll Effects
- **Homepage (not scrolled)**: Transparent navbar with `apple-glass`
- **Homepage (scrolled)**: Enhanced `apple-glass` with `shadow-lg`
- **Other pages**: Black background (`bg-black`)

#### Link Hover Effects
- Underline animation (grows from left)
- Color transition to white
- Smooth 300ms transition

### Command Palette

**Trigger:** `Cmd+K` (Mac) / `Ctrl+K` (Windows)

**Features:**
- Quick navigation
- Search functionality
- Keyboard shortcuts
- Recent items

**Styling:**
- Dark background: `rgb(9, 9, 11)`
- Rounded: `12px`
- Custom scrollbar
- Smooth animations

### Dashboard Navigation

#### Talent Dashboard
- **Tabs**: Overview, Applications, Discover
- **Quick Actions**: Profile, Settings, Subscribe
- **Stats Cards**: Applications, Gigs, Status

#### Client Dashboard
- **Tabs**: Overview, Gigs, Applications
- **Quick Actions**: Post Gig, Settings
- **Stats Cards**: Total Gigs, Applications, Completed

#### Admin Dashboard
- **Sidebar Navigation**: Dashboard, Users, Gigs, Moderation
- **Quick Stats**: Users, Gigs, Applications
- **Action Buttons**: Create User, etc.

---

## 📊 Dashboard Patterns

### Page Structure

#### Standard Dashboard Page
```tsx
<PageShell>
  <PageHeader
    title="Dashboard"
    subtitle="Welcome back"
    actions={<Button>Action</Button>}
  />
  
  <div className="space-y-6">
    <SectionCard>
      {/* Stats */}
    </SectionCard>
    
    <SectionCard>
      {/* Content */}
    </SectionCard>
  </div>
</PageShell>
```

### Stats Cards Pattern

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-sm font-medium">Total Gigs</CardTitle>
      <Icon />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">42</div>
      <p className="text-xs text-muted-foreground">+12% from last month</p>
    </CardContent>
  </Card>
</div>
```

### Data Tables Pattern

```tsx
<SectionCard paddingClassName="p-0">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="p-4 text-left">Column</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b">
          <td className="p-4">Data</td>
        </tr>
      </tbody>
    </table>
  </div>
</SectionCard>
```

### Empty States Pattern

```tsx
<EmptyState
  icon={Icon}
  title="No items found"
  description="Get started by creating your first item"
  action={{
    label: "Create Item",
    onClick: handleCreate
  }}
/>
```

### Loading States Pattern

```tsx
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
) : (
  <Content />
)}
```

---

## 📝 Form Patterns

### Standard Form Layout

```tsx
<Form>
  <div className="space-y-6">
    <FormField>
      <FormLabel>Field Label</FormLabel>
      <FormControl>
        <Input />
      </FormControl>
      <FormDescription>Helper text</FormDescription>
      <FormMessage />
    </FormField>
  </div>
  
  <div className="flex justify-end gap-4 mt-6">
    <Button variant="outline">Cancel</Button>
    <Button type="submit" loading={isSubmitting}>
      Submit
    </Button>
  </div>
</Form>
```

### Floating Label Form

```tsx
<FloatingInput
  label="Email Address"
  type="email"
  error={errors.email}
  success={isValid}
  showValidationIcon={true}
/>
```

### Multi-Step Forms

- Progress indicator
- Step navigation
- Form state persistence
- Validation per step

### Form Validation

**Real-time Validation:**
- On blur
- On change (debounced)
- Visual feedback (icons, colors)

**Error Display:**
- Red border
- Shake animation
- Error icon
- Error message below field

**Success Display:**
- Green border
- Checkmark icon
- No error message

---

## 🏷️ Status & Badge System

### Status Types

#### Gig Statuses
- `draft`: Gray, draft state
- `active`: Green, live gigs
- `closed`: Red, no longer accepting
- `completed`: Blue, finished
- `featured`: Amber, highlighted
- `urgent`: Orange, pulsing

#### Application Statuses
- `new`: Purple, just submitted
- `under_review`: Blue, being reviewed
- `shortlisted`: Cyan, top candidates
- `rejected`: Red, not selected
- `accepted`: Green, selected

#### Booking Statuses
- `pending`: Yellow, awaiting confirmation
- `confirmed`: Emerald, confirmed
- `cancelled`: Gray, cancelled

#### User Roles
- `talent`: Purple
- `client`: Blue
- `admin`: Rose (with shadow)

### Badge Usage

**With Icons:**
```tsx
<Badge variant="active" icon={<Icon />}>
  Active
</Badge>
```

**Status-Specific:**
```tsx
<GigStatusBadge status="active" showIcon={true} />
<ApplicationStatusBadge status="new" />
```

**Custom Glow:**
```tsx
<Badge variant="featured" glow="strong">
  Featured
</Badge>
```

---

## ⏳ Loading & Empty States

### Loading Spinner

```tsx
<LoadingSpinner size="md" />
```

**Sizes:**
- `sm`: 12px (h-3 w-3)
- `md`: 16px (h-4 w-4) - default
- `lg`: 24px (h-6 w-6)
- `xl`: 32px (h-8 w-8)

### Skeleton Loaders

```tsx
<Skeleton className="h-12 w-full" />
<Skeleton className="h-12 w-12 rounded-full" />
```

**Features:**
- Pulse animation
- Shimmer overlay
- Customizable shape

### Empty States

```tsx
<EmptyState
  icon={Inbox}
  title="No applications yet"
  description="Applications you receive will appear here"
  action={{
    label: "Post a Gig",
    href: "/post-gig"
  }}
/>
```

**Styling:**
- Centered layout
- Icon (48px)
- Title (semibold)
- Description (muted)
- Optional action button

---

## ♿ Accessibility

### Keyboard Navigation

- **Tab**: Navigate through interactive elements
- **Enter/Space**: Activate buttons, links
- **Escape**: Close modals, dialogs
- **Arrow Keys**: Navigate tabs, menus
- **Cmd/Ctrl+K**: Open command palette

### Focus Management

**Focus Rings:**
```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

**Focus Colors:**
- Ring: White (`ring: 0 0% 100%`)
- Offset: 2px for visibility

### ARIA Labels

- Buttons: Descriptive labels
- Icons: `aria-label` or `aria-hidden="true"`
- Forms: `aria-describedby` for errors
- Modals: `aria-labelledby`, `aria-describedby`

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Respects:**
- User's motion preferences
- Disables all animations
- Keeps functional transitions only

### Color Contrast

- **Text Primary**: 98% lightness on 12% background = **High contrast**
- **Text Secondary**: 90% lightness = **Good contrast**
- **Status Colors**: WCAG AA compliant
- **Focus Indicators**: High visibility

### Screen Reader Support

- Semantic HTML
- Proper heading hierarchy
- Alt text for images
- Form labels
- Error announcements

---

## 🎯 Design System Usage Guidelines

### When to Use Premium Effects

**Use `panel-frosted` + `card-backlit`:**
- Dashboard sections
- Elevated content panels
- Important information cards

**Use `button-glow`:**
- Primary CTAs
- Important actions
- Conversion-focused buttons

**Use `grain-texture`:**
- Premium cards
- Hero sections
- Special announcements

### Component Selection Guide

**Buttons:**
- Primary action → `variant="default"`
- Destructive → `variant="destructive"`
- Secondary → `variant="outline"`
- Tertiary → `variant="ghost"`

**Cards:**
- Standard content → `<Card>`
- Dashboard sections → `<SectionCard>`
- Premium content → `<SectionCard>` with `grain-texture`

**Inputs:**
- Standard forms → `<Input>`
- Premium forms → `<FloatingInput>`
- Long text → `<Textarea>` or `<FloatingTextarea>`

**Badges:**
- Status → `<StatusBadge>` or specific badge component
- Custom → `<Badge variant="...">`

---

## 📈 UX Improvement Opportunities

### Current Strengths

1. ✅ **Consistent Design Language**: Premium, cohesive aesthetic
2. ✅ **Mobile-First**: Responsive across all devices
3. ✅ **Accessibility**: WCAG AA compliant
4. ✅ **Performance**: Optimized animations
5. ✅ **Visual Hierarchy**: Clear information architecture

### Potential Improvements

#### 1. Micro-Interactions
- **Add**: More subtle hover feedback on cards
- **Add**: Success animations after actions
- **Add**: Progress indicators for multi-step flows

#### 2. Visual Feedback
- **Enhance**: Loading states with progress bars
- **Add**: Toast notifications for all actions
- **Improve**: Error messages with actionable steps

#### 3. Onboarding
- **Add**: Interactive tour for new users
- **Add**: Tooltips for complex features
- **Add**: Progressive disclosure for advanced options

#### 4. Personalization
- **Add**: User preferences (theme, density)
- **Add**: Customizable dashboard layouts
- **Add**: Saved filters and views

#### 5. Engagement
- **Add**: Achievement badges
- **Add**: Activity feed
- **Add**: Notifications center
- **Add**: Progress tracking

#### 6. Sticky Features
- **Add**: Recent items quick access
- **Add**: Favorites/bookmarks
- **Add**: Quick actions menu
- **Add**: Keyboard shortcuts guide

---

## 🔄 Component Patterns Summary

### Layout Components
- `PageShell`: Page container with padding
- `PageHeader`: Title, subtitle, actions
- `SectionCard`: Premium card with effects
- `DataTableShell`: Table wrapper

### UI Components
- `Button`: 7 variants, 4 sizes, loading/success states
- `Card`: Standard card with header/content/footer
- `Badge`: Status badges with icons
- `Input`: Standard input with focus glow
- `FloatingInput`: Premium input with floating label
- `Dialog`: Modal dialogs with animations
- `Tabs`: Tab navigation
- `Avatar`: User avatars with fallback

### Feedback Components
- `LoadingSpinner`: Animated spinner
- `Skeleton`: Loading skeleton
- `EmptyState`: Empty state with icon
- `Toast`: Notification toasts

### Status Components
- `GigStatusBadge`: Gig status display
- `ApplicationStatusBadge`: Application status
- `BookingStatusBadge`: Booking status
- `UserRoleBadge`: User role display

---

## 📚 Resources

### Design Tokens
- Colors: `app/globals.css` (OKLCH system)
- Typography: `tailwind.config.ts`
- Spacing: Tailwind default scale

### Component Library
- Location: `components/ui/`
- Base: shadcn/ui
- Custom: TOTL-specific components

### Layout Components
- Location: `components/layout/`
- Contract: `docs/features/UI_LAYOUT_CONTRACT.md`

### Documentation
- Visual Language: `docs/features/UI_VISUAL_LANGUAGE.md`
- Layout Contract: `docs/features/UI_LAYOUT_CONTRACT.md`
- CSS Best Practices: `docs/development/CSS_BEST_PRACTICES.md`

---

**Last Updated:** February 4, 2026  
**Maintained By:** TOTL Development Team  
**Version:** 1.0.0
