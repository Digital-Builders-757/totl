# 🧠 Totl Agency – Coding Standards & Best Practices

This is the canonical guide for writing clear, reusable, and performant code for the Totl Agency platform. All developers should adhere to these standards.

---

## ✅ Core Principles

- **TypeScript**: Use TypeScript for all components, props, and functions.
- **Next.js App Router**: Build pages and layouts within the `/app` directory, leveraging Server Components for data fetching where possible.
- **TailwindCSS**: Use TailwindCSS for all styling.
- **Shadcn/ui**: Use `shadcn/ui` for core UI elements (Card, Button, Input, etc.).
- **Responsiveness**: Design with a mobile-first approach.
- **Accessibility**: Ensure accessibility with semantic HTML and ARIA attributes.

---

## 🗃 Folder Structure

- `/app` - Page routes, layouts, and data fetching (Server Components).
- `/components` - Reusable, **presentational-only** UI components.
  - `/components/ui` - Core `shadcn/ui` components.
- `/lib` - Supabase client, shared utilities, API helpers, and type definitions.
- `/supabase/migrations` - Database schema changes (SQL files).
- `/hooks` - Custom React hooks (e.g., `useEmailService`).
- `/types` - Global or complex TypeScript type definitions.

---

## 🧩 Component Standards

- **Presentational Only**: Components in `/components` should not fetch data directly. Pass data in as props from Server Components.
- **Named Exports**: Use named functions: `export function MyComponent() { ... }`
- **Props Interface**: Define a `Props` interface for every component.
- **`cn()` Utility**: Use the `cn()` utility from `lib/utils.ts` for conditional or dynamic class names.
- **`SafeImage` Component**: Use the `<SafeImage />` component for all images to ensure fallbacks and prevent layout shift.

---

## 🌊 Data Fetching & State Management

- **Server Components**: Fetch data in Server Components (`page.tsx`, `layout.tsx`) wherever possible. This is the default in the App Router.
- **`safeQuery` Wrapper**: Use the `lib/safe-query.ts` wrapper for all Supabase queries to ensure they are RLS-safe. See `docs/safe-supabase-queries.md` for more info.
- **Client-Side State**:
  - Use React's built-in state (`useState`, `useReducer`) for simple, local state.
  - Use React Context for state that needs to be shared across a few components.
  - For complex global state, consider a lightweight library like Zustand.
- **API Functions**: Keep reusable server-side functions (e.g., calls to Supabase) in `/lib/actions/` or `/lib/api/`.

---

## 📝 Forms & Validation

- **`react-hook-form` & `zod`**: Use this combination for all forms to handle state, submission, and validation.
- **Reusable Form Components**: Create and use standardized components like `<FormField>` and `<SubmitButton>` (with loading states).
- **Server Actions**: Use Next.js Server Actions for form submissions to simplify logic and reduce client-side code.

---

## 🛡️ Security

- **RLS is Always On**: Assume all tables are protected by Row-Level Security. Queries must be written with RLS in mind.
- **Never Expose Secrets**: Keep all API keys, service roles, and other secrets in environment variables (`.env.local`). Never commit them to git.
- **Validate and Sanitize**: Always validate user input on both the client (for UX) and server (for security).

---

## 💅 Styling Conventions

- **Utility-First**: Use Tailwind's utility classes directly. Avoid `@apply` and custom CSS where possible.
- **Theme Variables**: Use colors and spacing from `tailwind.config.ts` (`bg-background`, `text-primary`, `p-4`, `rounded-lg`).
- **Responsive Prefixes**: Use responsive prefixes for mobile-first design (`hidden md:block`, `grid-cols-1 md:grid-cols-3`).

---

## 📚 Documentation

- **JSDoc**: Document complex functions and components with JSDoc comments.
- **READMEs**: Add a `README.md` for new, complex features.
- **Update These Docs**: This guide is a living document. If you establish a new best practice, update it here.

By following these standards, we keep Totl Agency fast, clear, and beautiful — built to scale. ✨
