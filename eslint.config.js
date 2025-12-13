import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  {
    ignores: [
      "dist",
      "node_modules",
      "coverage",
      "build",
      "*.config.js",
      "eslint.config.js",
      "vite.config.ts",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ["./tsconfig.app.json", "./tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      prettier: prettierPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // Prettier
      "prettier/prettier": [
        "error",
        {
          semi: true,
        },
      ],

      // React Refresh
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // TypeScript specific rules
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/strict-boolean-expressions": [
        "warn",
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: true,
          allowNullableBoolean: true,
          allowNullableString: true,
          allowNullableNumber: true,
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: true,
        },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          "ts-nocheck": true,
          "ts-check": false,
          minimumDescriptionLength: 3,
        },
      ],

      // General best practices
      "no-console": ["warn", { allow: ["warn", "error", "debug"] }],
      eqeqeq: ["error", "always"],
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
      "prefer-arrow-callback": "error",
      "no-nested-ternary": "warn",
      "no-unneeded-ternary": "error",
    },
  },
  // Disable type-checking rules for JS files
  {
    files: ["**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  },
  // Apply prettier config last to override any conflicting rules
  prettierConfig,
];
