/**
 * TOTL Agency Project Structure
 *
 * This is a representation of the current project structure.
 * Files are organized by feature and functionality.
 */

// Project Structure
const projectStructure = {
  // Root app directory
  app: {
    // Global files
    "layout.tsx": "Root layout with Navbar and ThemeProvider",
    "globals.css": "Global CSS styles and Tailwind utilities",
    "page.tsx": "Homepage with hero, featured models, and sections",

    // Admin section
    admin: {
      "layout.tsx": "Admin layout with ThemeProvider",
      dashboard: {
        "page.tsx": "Client dashboard with gigs, applications, and stats",
        "loading.tsx": "Loading state for dashboard",
      },
      gigs: {
        create: {
          "page.tsx": "Form to create a new gig",
          "loading.tsx": "Loading state for gig creation",
        },
        success: {
          "page.tsx": "Success page after gig creation",
          "loading.tsx": "Loading state for success page",
        },
      },
      talentdashboard: {
        "page.tsx": "Talent dashboard with portfolio, applications, and bookings",
        "loading.tsx": "Loading state for talent dashboard",
      },
    },

    // Client section
    client: {
      signup: {
        "page.tsx": "Client registration form",
      },
    },

    // Talent section
    talent: {
      "page.tsx": "Browse talent page with grid of models",
      "loading.tsx": "Loading state for talent page",
      signup: {
        "page.tsx": "Talent application form",
      },
      "[id]": {
        "page.tsx": "Individual talent profile page",
      },
    },

    // Gigs section
    gigs: {
      "page.tsx": "Browse gigs page with list of available gigs",
      "loading.tsx": "Loading state for gigs page",
      "[id]": {
        "page.tsx": "Individual gig detail page",
      },
    },

    // Authentication
    login: {
      "page.tsx": "Login page",
    },

    // Other pages
    "post-gig": {
      "page.tsx": "Public gig posting form",
    },
  },

  // Components
  components: {
    "navbar.tsx": "Main navigation bar",
    "theme-provider.tsx": "Theme context provider for light/dark mode",
    "safe-image.tsx": "Image component with fallback handling",
    ui: {
      "avatar.tsx": "User avatar component with SafeImage integration",
      "badge.tsx": "Badge component for status indicators",
      "button.tsx": "Button component with variants",
      "card.tsx": "Card component for content containers",
      "dropdown-menu.tsx": "Dropdown menu component",
      "empty-state.tsx": "Empty state component for empty lists",
      "input.tsx": "Input component for forms",
      "label.tsx": "Label component for form fields",
      "loading-spinner.tsx": "Loading spinner component",
      "safe-image.tsx": "Image component with fallback handling",
      "select.tsx": "Select dropdown component",
      "submit-button.tsx": "Submit button with loading state",
      "tabs.tsx": "Tabs component for tabbed interfaces",
      "textarea.tsx": "Textarea component for forms",
    },
  },

  // Lib (utility functions)
  lib: {
    "utils.ts": "Utility functions including className merging",
    "image-utils.ts": "Image utility functions",
  },

  // Documentation
  docs: {
    "best-practices.md": "Best practices guide for the codebase",
  },
};

export default projectStructure;
