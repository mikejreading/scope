import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Ignore generated Prisma client files
    ignores: [
      "src/generated/**/*",
      "src/lib/prisma/prisma-client-*"
    ]
  },
  {
    // Global rules
    rules: {
      // Add any global rules here
    }
  }
];

export default eslintConfig;
