/**
 * Active ESLint config for `next lint` / ESLint CLI.
 *
 * Note: If `.eslintrc.json` is added alongside this file without being extended,
 * ESLint loads only this file — stricter rules in JSON would be ignored. See
 * `docs/TOTL_REPO_HYGIENE_AND_DOCUMENTATION_AUDIT_MASTER_PLAN_2026.md` (deferred follow-ups).
 */
module.exports = {
  extends: [
    "next/core-web-vitals",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
  ],
  plugins: ["@typescript-eslint", "import"],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "warn",
    "react/no-unescaped-entities": "warn",
    "react/react-in-jsx-scope": "off",
    "@next/next/no-img-element": "warn",
    "import/order": ["warn", { alphabetize: { order: "asc" } }],
    // Block console.log/debug in production code - use logger utility instead
    "no-console": [
      "error",
      {
        allow: ["warn", "error"], // Allow console.warn/error for critical errors before logger init
      },
    ],
  },
};
