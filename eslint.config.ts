import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginImport from "eslint-plugin-import";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["dist/**", "node_modules/**"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,

  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: {
      react: pluginReact,
      import: pluginImport,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "import/no-duplicates": "error",

      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-empty": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },

  {
    files: [
      "src/altar/**/*.{ts,tsx}",
      "src/modules/chakra-intelligence/components/**/*.{ts,tsx}",
    ],
    rules: {
      "react/no-unknown-property": "off",
    },
  },

  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
]);