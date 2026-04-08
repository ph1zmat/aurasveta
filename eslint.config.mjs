import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Ban mock imports in production code
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.test.*", "**/*.spec.*", "**/tests/**", "**/__tests__/**", "prisma/seed.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/shared/mocks/*", "*/shared/mocks/*"],
          message: "Mock data imports are banned in production code. Use real DB queries via tRPC or entity services.",
        }],
      }],
    },
  },
]);

export default eslintConfig;
