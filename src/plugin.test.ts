import { describe, it, expect } from 'vitest'
import type { Plugin } from 'vite'
import { removeBeforeFlightPlugin } from './plugin'

/** Get the transform handler; Vite plugins can use either a function or { handler, order }. */
function getTransformHandler(plugin: Plugin): ((code: string, id: string) => unknown) | undefined {
    const hook = plugin.transform
    if (!hook) return undefined
    return typeof hook === 'function' ? hook : (hook as { handler: (code: string, id: string) => unknown }).handler
}

function runTransform(code: string, id: string): string | null {
    const plugin = removeBeforeFlightPlugin()
    const handler = getTransformHandler(plugin)
    if (!handler) throw new Error('Plugin has no transform')
    const result = handler.call(null, code, id)
    if (result == null || typeof result === 'string') return result as string | null
    return (result as { code?: string }).code ?? null
}

describe('removeBeforeFlightPlugin', () => {
    it('has name and apply build', () => {
        const plugin = removeBeforeFlightPlugin()
        expect(plugin.name).toBe('nuxt-remove-before-flight')
        expect(plugin.apply).toBe('build')
    })

    it('returns null for non-matching file extensions', () => {
        expect(runTransform('const x = 1', '/app/file.css')).toBe(null)
        expect(runTransform('const x = 1', '/app/file.json')).toBe(null)
        expect(runTransform('const x = 1', '/app/file.html')).toBe(null)
    })

    it('returns null when code is empty or not a string', () => {
        expect(runTransform('', '/app/file.ts')).toBe(null)
        const plugin = removeBeforeFlightPlugin()
        const handler = getTransformHandler(plugin)
        expect(handler).toBeDefined()
        const result = handler!.call(null, null as unknown as string, '/app/file.ts')
        expect(result).toBe(null)
    })

    it('strips .ts file content', () => {
        const code = 'a()\n// @remove-before-flight\nb()\nc()'
        const out = runTransform(code, '/app/foo.ts')
        expect(out).toBe('a()\nc()')
    })

    it('strips .js file content', () => {
        const code = 'x()\n// @remove-before-flight\ny()'
        const out = runTransform(code, '/app/bar.js')
        expect(out).toBe('x()')
    })

    it('strips .mjs / .cjs file content', () => {
        const code = 'p()\n// @remove-before-flight\nq()'
        expect(runTransform(code, '/app/mod.mjs')).toBe('p()')
        expect(runTransform(code, '/app/mod.cjs')).toBe('p()')
    })

    it('strips script blocks in .vue file', () => {
        const code = [
            '<script setup>',
            'const x = 1',
            '// @remove-before-flight',
            'const y = 2',
            '</script>',
            '<template><div /></template>',
        ].join('\n')
        const out = runTransform(code, '/app/Page.vue')
        expect(out).toContain('<script setup>')
        expect(out).toContain('const x = 1')
        expect(out).not.toContain('// @remove-before-flight')
        expect(out).not.toContain('const y = 2')
        expect(out).toContain('<template><div /></template>')
    })

    it('strips template block with HTML marker in .vue file', () => {
        const code = [
            '<template>',
            '  <!-- @remove-before-flight -->',
            '  <DevOnly />',
            '  <Real />',
            '</template>',
        ].join('\n')
        const out = runTransform(code, '/app/App.vue')
        expect(out).toContain('<template>')
        expect(out).not.toContain('<!-- @remove-before-flight -->')
        expect(out).not.toContain('<DevOnly />')
        expect(out).toContain('<Real />')
        expect(out).toContain('</template>')
    })

    it('handles .vue?query id (Vite may pass full SFC content)', () => {
        const code = [
            '<script setup>',
            '// @remove-before-flight',
            'const removed = true',
            '</script>',
            '<template><div /></template>',
        ].join('\n')
        const out = runTransform(code, '/app/comp.vue?script&type=script')
        expect(out).toContain('<script setup>')
        expect(out).not.toContain('// @remove-before-flight')
        expect(out).not.toContain('const removed = true')
        expect(out).toContain('<template><div /></template>')
    })
})
