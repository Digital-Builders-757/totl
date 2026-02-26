# UI Visual Language & Component Guidelines

**Scope Note:** This document defines visual language and styling patterns. For UX contracts, role-surface separation, responsive behavior rules, and enforcement, see `docs/UI_CONSTITUTION.md`.

## Overview

This document outlines the visual design system and component patterns used throughout the TOTL Agency platform, focusing on our premium, back-lit minimalism aesthetic.

## Design Principles

### 1. Back-Lit Minimalism
- **Frosted Glass Effects**: Use `panel-frosted` class for translucent, blurred backgrounds
- **Subtle Glows**: Implement `button-glow` and `card-backlit` for premium lighting effects
- **Grain Texture**: Apply `grain-texture` for sophisticated surface details
- **OKLCH Color Space**: Leverage CSS custom properties for consistent, perceptually uniform colors

### 2. Motion & Accessibility
- **Reduced Motion Support**: All animations respect `prefers-reduced-motion`
- **Smooth Transitions**: Use CSS transitions over JavaScript animations
- **Focus Management**: Clear focus indicators with `focus-visible` rings

## Core Components

### SignInGate Component

**Location**: `components/auth/sign-in-gate.tsx`

**Purpose**: Premium authentication gate for protected content areas

**Usage**:
```tsx
import { SignInGate } from "@/components/auth/sign-in-gate";

// In server components
if (!user) {
  return <SignInGate variant="gigs" />;
}
```

**Variants**:
- `gigs`: Lock icon, "Sign in to view gigs" messaging
- `talent`: Users icon, "Sign in to explore talent" messaging

**Features**:
- Frosted glass panel with backlit effect
- Subtle animated glow halo (respects reduced motion)
- Three-tier CTA hierarchy: Primary, Secondary, Learn More
- Full keyboard navigation support
- Analytics integration (non-blocking)

**Styling Classes**:
- `panel-frosted`: Main container with frosted glass effect
- `card-backlit`: Subtle backlighting and hover effects
- `button-glow`: Primary CTA with gradient and glow
- `grain-texture`: Surface texture overlay
- `motion-safe:animate-pulse`: Conditional animation

**Accessibility**:
- Proper heading hierarchy (h1)
- Descriptive button text
- Focus-visible rings on all interactive elements
- Keyboard navigation: Tab order through primary CTA → secondary CTA → learn more

**Implementation Notes**:
- Client component only (no database calls)
- Server-side session checking in parent pages
- No data fetching when unauthenticated
- Uses existing shadcn/ui Button component
- Lucide React icons (Lock, Users, Sparkles)

## Mobile UX Guidelines

### App-Like Experience
- **Snap to Top**: Use `pt-20 sm:pt-24` for mobile-first header spacing
- **Tight Spacing**: Use `py-4 sm:py-12` for container padding
- **Reduced Margins**: Use `mb-4 sm:mb-8` for mobile-optimized spacing
- **Responsive Text**: Use `text-3xl sm:text-5xl` for mobile-first typography

### Mobile-First Patterns
```tsx
// Container spacing
<div className="min-h-screen bg-black pt-20 sm:pt-24">
  <div className="container mx-auto px-4 py-4 sm:py-12">
    <Link className="mb-4 sm:mb-8">Back</Link>
    <h1 className="text-3xl sm:text-5xl">Title</h1>
  </div>
</div>
```

### Touch Optimization
- **Minimum Touch Targets**: 44px minimum (handled in globals.css)
- **Tap Feedback**: Active states with `opacity: 0.8` and `scale(0.98)`
- **No Hover on Touch**: Disabled hover effects for touch devices
- **Safe Area Support**: iOS safe area insets for notched devices

## Utility Classes

### Panel Effects
```css
.panel-frosted {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Card Effects
```css
.card-backlit {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Button Effects
```css
.button-glow {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
}
```

### Texture Effects
```css
.grain-texture::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('data:image/svg+xml;base64,...');
  opacity: 0.1;
  pointer-events: none;
}
```

## Color System

### OKLCH Custom Properties
```css
:root {
  --oklch-bg: oklch(0.05 0.01 250);
  --oklch-text-primary: oklch(0.95 0.01 250);
  --oklch-text-secondary: oklch(0.7 0.01 250);
  --oklch-text-tertiary: oklch(0.5 0.01 250);
}
```

### Gradient Patterns
- **Primary**: Blue to Purple (`from-blue-600 to-purple-600`)
- **Secondary**: Subtle grays with transparency
- **Accent**: Blue to Purple with reduced opacity for backgrounds

## Animation Guidelines

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  .motion-* {
    animation: none !important;
    transition: none !important;
  }
}
```

### Transition Patterns
- **Hover**: 200ms ease-in-out
- **Focus**: 150ms ease-out
- **Page Load**: 300ms ease-out

## Component Patterns

### Authentication Gates
1. **Server-side session check** in page components
2. **Client-side gate component** for UI only
3. **No data fetching** when unauthenticated
4. **Clear CTA hierarchy** with proper routing

### Form Components
1. **shadcn/ui primitives** as base
2. **Custom styling** for brand consistency
3. **Accessibility first** with proper labels and focus management
4. **Error states** with clear messaging

### Navigation Elements
1. **Breadcrumb patterns** for deep navigation
2. **Role-based visibility** for dashboard links
3. **Mobile-first responsive** design
4. **Touch-optimized** interaction targets (44px minimum)

## Testing Requirements

### Playwright Tests
- **Visual regression** testing for component states
- **Accessibility** testing with keyboard navigation
- **Responsive** testing across device sizes
- **Motion preferences** testing

### Component Testing
- **Props validation** with TypeScript
- **Accessibility** with screen reader testing
- **Performance** with bundle size monitoring

## Implementation Checklist

When creating new components:

- [ ] Use existing utility classes (`panel-frosted`, `card-backlit`, etc.)
- [ ] Implement proper focus management
- [ ] Add reduced motion support
- [ ] Include proper TypeScript types
- [ ] Add Playwright tests
- [ ] Document usage patterns
- [ ] Follow accessibility guidelines
- [ ] Use OKLCH color system
- [ ] Implement responsive design
- [ ] Add proper error states

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Lucide React Icons](https://lucide.dev/)
- [OKLCH Color Space](https://oklch.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Playwright Testing](https://playwright.dev/)
