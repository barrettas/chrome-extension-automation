module.exports = {
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier'],
  env: {
    jest: true,
    browser: true
  },
  parserOptions: {
    ecmaFeatures: {
      modules: true
    }
  },
  rules: {
    'prettier/prettier': ['error', {
      singleQuote: true,
      trailingComma: 'all',
    }],
    'func-names': 0,
    'id-length': [1, {'exceptions': ['$']}],
    'new-cap': [2, {'capIsNewExceptions': ['Deferred']}],
    'max-len': 0,
    'no-prototype-builtins': 0,
    'import/extensions': 0,
    'import/prefer-default-export': 0,
    'no-underscore-dangle': 0,
    'no-useless-escape': 0,
    'class-methods-use-this': 0,
    'no-param-reassign': 0,
    'no-restricted-syntax': 0,
    'consistent-return': 0,
    'array-callback-return': 0,
  },
  globals: {
    fixture: true,
    chrome: true,
    localStorage: true,
    ['$']: true
  }
}
