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
    // Vendored catalogue, gitignored (.gitignore:67) and 221 MB. Linting it
    // produced 21,901 of the 22,299 reported problems, which buried the 398
    // in our own code and made `npm run lint` useless.
    "react-bits/**",
    // Other sessions' nested git worktrees (.gitignore:60). 20,554 more.
    ".claude/**",
  ]),
]);

export default eslintConfig;
