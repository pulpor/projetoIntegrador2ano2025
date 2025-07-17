import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

const ignores = ['dist']

const files = ['**/*.{ts,tsx}']

const languageOptions = {
  ecmaVersion: 2020,
  globals: globals.browser,
}

const plugins = {
  'react-hooks': reactHooks,
  'react-refresh': reactRefresh,
}

const rules = {
  ...reactHooks.configs.recommended.rules,
  'react-refresh/only-export-components': [
    'warn',
    { allowConstantExport: true },
  ],
}

export default tseslint.config(
  { ignores },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files,
    languageOptions,
    plugins,
    rules,
  },
)
