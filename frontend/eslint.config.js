// ESLint flat config for Vite + React (ESLint v9)
// Docs: https://eslint.org/docs/latest/use/configure/configuration-files-new

import js from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  // Ignore generated and config files
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      "coverage/",
      "vite.config.*",
    ],
  },

  // Base config for JS/JSX source files
  {
    files: ["src/**/*.{js,jsx}", "*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: { version: "detect" },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "react-refresh": pluginReactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,

      // Hooks rules
      ...pluginReactHooks.configs.recommended.rules,

      // React Fast Refresh
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // Project preferences
      "react/prop-types": "off", // using JS without PropTypes; disable rule
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];
