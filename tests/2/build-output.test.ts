/**
 * Tests for issue #2: `package.json` refers to nonexistent file, breaking package
 * https://github.com/jotaijs/jotai-transaction/issues/2
 *
 * The `module` field pointed to `dist/index.esm.js` but the file was missing
 * from the published package because the build tool (tsdx) was not generating it.
 * Fix: switched build to Vite library mode which outputs both CJS and ESM formats.
 */
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const distDir = resolve(root, 'dist')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'))

describe('issue #2 – ESM build output', () => {
  describe('dist file existence', () => {
    it('produces dist/index.esm.js (the file that was missing)', () => {
      expect(existsSync(resolve(distDir, 'index.esm.js'))).toBe(true)
    })

    it('produces dist/index.js (CJS)', () => {
      expect(existsSync(resolve(distDir, 'index.js'))).toBe(true)
    })

    it('produces dist/index.d.ts (TypeScript declarations)', () => {
      expect(existsSync(resolve(distDir, 'index.d.ts'))).toBe(true)
    })
  })

  describe('dist/index.esm.js format', () => {
    it('is an ES module (uses import statements)', () => {
      const content = readFileSync(resolve(distDir, 'index.esm.js'), 'utf-8')
      expect(content).toMatch(/^import\s/m)
    })

    it('does not use require()', () => {
      const content = readFileSync(resolve(distDir, 'index.esm.js'), 'utf-8')
      expect(content).not.toMatch(/\brequire\s*\(/)
    })
  })

  describe('dist/index.js format', () => {
    it('is a CJS module (uses exports)', () => {
      const content = readFileSync(resolve(distDir, 'index.js'), 'utf-8')
      expect(content).toMatch(/exports\.[a-zA-Z]/)
    })
  })

  describe('package.json exports field', () => {
    it('has an exports field', () => {
      expect(pkg.exports).toBeDefined()
    })

    it('exports "." entry', () => {
      expect(pkg.exports['.']).toBeDefined()
    })

    it('exports "." import points to ESM file', () => {
      expect(pkg.exports['.'].import).toBe('./dist/index.esm.js')
    })

    it('exports "." require points to CJS file', () => {
      expect(pkg.exports['.'].require).toBe('./dist/index.js')
    })

    it('exports "." types points to declaration file', () => {
      expect(pkg.exports['.'].types).toBe('./dist/index.d.ts')
    })

    it('"types" condition comes before "import" and "require" for correct TS resolution', () => {
      const keys = Object.keys(pkg.exports['.'])
      expect(keys.indexOf('types')).toBeLessThan(keys.indexOf('import'))
      expect(keys.indexOf('types')).toBeLessThan(keys.indexOf('require'))
    })
  })

  describe('package.json legacy fields', () => {
    it('"module" field matches the exports import path', () => {
      expect(pkg.module).toBe('dist/index.esm.js')
    })

    it('"main" field matches the exports require path', () => {
      expect(pkg.main).toBe('dist/index.js')
    })

    it('"types" field matches the exports types path', () => {
      expect(pkg.types).toBe('dist/index.d.ts')
    })
  })

  describe('public API surface in built output', () => {
    const publicExports = [
      'beginTransaction',
      'commitTransaction',
      'rollbackTransaction',
      'useTransaction',
      'useTransactionStatus',
    ]

    it.each(publicExports)('ESM build exports %s', (name) => {
      const content = readFileSync(resolve(distDir, 'index.esm.js'), 'utf-8')
      expect(content).toContain(name)
    })

    it.each(publicExports)('CJS build exports %s', (name) => {
      const content = readFileSync(resolve(distDir, 'index.js'), 'utf-8')
      expect(content).toContain(name)
    })
  })
})
