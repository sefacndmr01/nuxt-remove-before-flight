import { describe, it, expect } from 'vitest'
import {
    lineHasJsMarker,
    lineHasHtmlMarker,
    stripRemoveBeforeFlight,
} from './transform'

describe('lineHasJsMarker', () => {
    it('returns true when line contains // @remove-before-flight', () => {
        expect(lineHasJsMarker('  // @remove-before-flight')).toBe(true)
        expect(lineHasJsMarker('// @remove-before-flight')).toBe(true)
        expect(lineHasJsMarker('foo(); // @remove-before-flight')).toBe(true)
    })

    it('returns false when line does not contain the marker', () => {
        expect(lineHasJsMarker('// other comment')).toBe(false)
        expect(lineHasJsMarker('<!-- @remove-before-flight -->')).toBe(false)
        expect(lineHasJsMarker('')).toBe(false)
    })
})

describe('lineHasHtmlMarker', () => {
    it('returns true when line contains <!-- @remove-before-flight -->', () => {
        expect(lineHasHtmlMarker('  <!-- @remove-before-flight -->')).toBe(true)
        expect(lineHasHtmlMarker('<!-- @remove-before-flight -->')).toBe(true)
    })

    it('returns false when line does not contain the HTML marker', () => {
        expect(lineHasHtmlMarker('// @remove-before-flight')).toBe(false)
        expect(lineHasHtmlMarker('<!-- other -->')).toBe(false)
    })
})

describe('stripRemoveBeforeFlight (JS/TS marker)', () => {
    it('returns code unchanged when no marker is present', () => {
        const code = 'const x = 1\nconst y = 2'
        expect(stripRemoveBeforeFlight(code)).toBe(code)
    })

    it('removes single line: comment line + next line', () => {
        const code = [
            'function init() {',
            '  // @remove-before-flight',
            '  console.log("dev only")',
            '  doRealInit()',
            '}',
        ].join('\n')
        const expected = [
            'function init() {',
            '  doRealInit()',
            '}',
        ].join('\n')
        expect(stripRemoveBeforeFlight(code)).toBe(expected)
    })

    it('removes block: from first marker through second marker (inclusive)', () => {
        const code = [
            'function setup() {',
            '  // @remove-before-flight',
            '  if (import.meta.dev) {',
            '    useFakeBackend()',
            '  }',
            '  // @remove-before-flight',
            '  useRealBackend()',
            '}',
        ].join('\n')
        const expected = [
            'function setup() {',
            '  useRealBackend()',
            '}',
        ].join('\n')
        expect(stripRemoveBeforeFlight(code)).toBe(expected)
    })

    it('handles multiple blocks in one file', () => {
        const code = [
            'a()',
            '// @remove-before-flight',
            'b()',
            '// @remove-before-flight',
            'c()',
            '// @remove-before-flight',
            'd()',
            'e()',
        ].join('\n')
        const expected = ['a()', 'c()', 'e()'].join('\n')
        expect(stripRemoveBeforeFlight(code)).toBe(expected)
    })

    it('handles unpaired marker as single-line (comment + next line)', () => {
        const code = [
            'x()',
            '// @remove-before-flight',
            'y()',
            'z()',
        ].join('\n')
        const expected = ['x()', 'z()'].join('\n')
        expect(stripRemoveBeforeFlight(code)).toBe(expected)
    })

    it('single marker at end of file removes only that line if no next line', () => {
        const code = ['a()', '// @remove-before-flight'].join('\n')
        const expected = ['a()'].join('\n')
        expect(stripRemoveBeforeFlight(code)).toBe(expected)
    })

    it('empty string returns empty string', () => {
        expect(stripRemoveBeforeFlight('')).toBe('')
    })
})

describe('stripRemoveBeforeFlight (HTML marker)', () => {
    it('removes single line with HTML comment marker when useHtmlMarker true', () => {
        const code = [
            '<div>',
            '  <!-- @remove-before-flight -->',
            '  <p>Dev only</p>',
            '  <span>Keep</span>',
            '</div>',
        ].join('\n')
        const expected = [
            '<div>',
            '  <span>Keep</span>',
            '</div>',
        ].join('\n')
        expect(stripRemoveBeforeFlight(code, true)).toBe(expected)
    })

    it('removes block with two HTML markers when useHtmlMarker true', () => {
        const code = [
            '<template>',
            '  <!-- @remove-before-flight -->',
            '  <DebugPanel />',
            '  <!-- @remove-before-flight -->',
            '  <RealContent />',
            '</template>',
        ].join('\n')
        const expected = [
            '<template>',
            '  <RealContent />',
            '</template>',
        ].join('\n')
        expect(stripRemoveBeforeFlight(code, true)).toBe(expected)
    })

    it('does not strip JS marker when useHtmlMarker is true', () => {
        const code = '// @remove-before-flight\nconst x = 1'
        expect(stripRemoveBeforeFlight(code, true)).toBe(code)
    })
})
