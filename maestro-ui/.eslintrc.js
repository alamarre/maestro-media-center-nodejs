module.exports = {
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 10,
    "sourceType": "module"
  },
  "env": {
    "node": false,
  },
  "globals": {
    "Promise": true,
    "Response": true,
    "addEventListener": true
  },
  "rules": {
    "linebreak-style": ["error", "unix"],
    "quotes": ["error", "double"],
    "semi": ["error", "always"],

    // override default options for rules from base configurations
    "comma-dangle": ["error", "always"],
    "no-cond-assign": ["error", "always"],

    // disable rules from base configurations
    "no-console": "off",
    "prefer-const": "error",
    "strict": ["error", "global"],
  }
}
