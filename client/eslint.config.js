import { defineConfig, globalIgnores } from 'eslint/config'
import next from 'eslint-config-next'

export default defineConfig([
  globalIgnores(['.next', 'out', 'dist', 'node_modules']),
  ...next,
])
