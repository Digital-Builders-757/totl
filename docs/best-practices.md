# 🛠️ TOTL Agency Codebase – Best Practices

## 📦 Project Structure
- Use **feature-based folders** in `/app` or `/components`
  - Example: `/components/talent`, `/components/gigs`, `/components/auth`
- Keep shared UI elements in `/components/ui`
- Group related functionality:
  \`\`\`
  /app
    /talent
      /[id]
        page.tsx
      page.tsx
    /gigs
      /[id]
        page.tsx
      page.tsx
    /admin
      /dashboard
        page.tsx
      /gigs
        /create
          page.tsx
        /success
          page.tsx
  \`\`\`

## 🧼 Clean Code Standards
- Use `SafeImage.tsx` for all image rendering
- Always destructure props at the top of components
- Use `camelCase` for variables, `PascalCase` for components
- Limit component size to 100 lines max
- Reuse Shadcn UI components — don't re-style from scratch
- Use named exports for components: `export function ComponentName()`
- Keep JSX clean with helper functions for complex logic

## 🔐 Auth & Access Control
- Use Supabase RLS (Row Level Security) to separate Talent & Client data access
- Don't render private data on the client until confirmed via `session?.user`
- Create role-based layouts:
  - `/app/admin/layout.tsx` for admin-only pages
  - `/app/talent/layout.tsx` for talent-only pages
  - `/app/client/layout.tsx` for client-only pages

## 🧪 Type Safety & Guards
- Use TypeScript types from Supabase: `Database['public']['Tables']['users']['Row']`
- Validate props and fields with `zod` or fallback utils like `getSafeImageUrl()`
- Never assume a value exists — check with `?.` or fallback
- Create type definitions for all data structures:
  \`\`\`typescript
  type Talent = {
    id: number;
    name: string;
    specialty: string;
    // ...other fields
  }
  \`\`\`

## 🧠 Forms & Validation
- Use `react-hook-form` + `zod` for any form with user input
- Always validate file types & sizes on image upload
- Create reusable form components:
  - `<FormField />` - Wrapper for form inputs with label and error
  - `<SubmitButton />` - Button with loading state
- Add client-side validation before server submission

## ⚙️ API & Server Functions
- Keep API calls in `lib/api/*.ts`
- Use `async/await`, no `.then()` chaining
- Return typed responses (`{ success: boolean, data?: T, error?: string }`)
- Create service functions for Supabase operations:
  \`\`\`typescript
  // lib/api/talent.ts
  export async function getTalentById(id: string) {
    try {
      const { data, error } = await supabase
        .from('talent')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  \`\`\`

## 💅 Styling & UI
- Use **Tailwind** utility classes over inline styles
- Use `shadcn/ui` components for all new forms, modals, buttons
- Keep classNames short and responsive (`text-sm md:text-base`)
- Use the `cn()` utility for conditional classes:
  \`\`\`typescript
  import { cn } from "@/lib/utils";
  
  <div className={cn(
    "base-styles-here",
    isActive && "active-styles-here",
    variant === "primary" ? "primary-styles" : "secondary-styles"
  )}>
  \`\`\`
- Create a consistent color palette in `tailwind.config.js`

## 🧹 Deployment Hygiene
- Preview on Vercel before production merge
- Auto-format on save (set Prettier rules)
- Keep `.env.local` clean & documented
- Use environment variables for all API keys and secrets
- Create a `.env.example` file with placeholder values

## 🧩 MVP Feature Design
- Stay lean — solve one workflow well before layering on more
- Use feature flags or booleans (`isVerified`, `isTalent`, `hasSubmitted`) to power flows
- Build for mobile first — keep file sizes small & layouts stackable
- Create user journeys for each feature:
  1. Talent signs up
  2. Talent creates profile
  3. Talent browses gigs
  4. Talent applies to gig

## 🖼️ Image Handling
- Always use `<SafeImage />` component for rendering images
- Optimize images before upload (compress, resize)
- Use appropriate image formats:
  - JPG for photos
  - PNG for graphics with transparency
  - WebP for better compression
- Set proper width and height attributes to prevent layout shifts
- Use the `getSafeImageUrl()` utility for URL-only contexts

## 🔄 State Management
- Use React's built-in state management for simple components
- Use React Context for shared state across components
- Consider Zustand for more complex state management
- Keep state as close to where it's used as possible

## ✅ Reusable Components Checklist
- [x] `<SafeImage />` - Image component with fallback
- [ ] `<LoadingSpinner />` - Consistent loading indicator
- [ ] `<SubmitButton />` - Button with loading state
- [ ] `<EmptyState />` - For lists with no content
- [ ] `<Avatar />` - User avatar with fallback
- [ ] `<ErrorBoundary />` - Catch and display errors
- [ ] `<ConfirmDialog />` - Confirmation dialog
- [ ] `<PageHeader />` - Consistent page headers
- [ ] `<Card />` - Consistent card component
- [ ] `<FormField />` - Form field with label and error

## 🧪 Testing
- Write unit tests for critical utility functions
- Create integration tests for key user flows
- Test on multiple devices and browsers
- Use mock data for testing UI components

## 📚 Documentation
- Document complex components with JSDoc comments
- Create README files for major features
- Keep this best practices guide updated
- Document API endpoints and data structures

---

Want to add your own? Just push updates to `/docs/best-practices.md` and share with new team members.
\`\`\`

Let's also create a reusable Avatar component that uses our SafeImage:
