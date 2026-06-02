const js = require("@eslint/js");
const prettier = require("eslint-plugin-prettier/recommended");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "require-await": "error",
    },
  },
];
