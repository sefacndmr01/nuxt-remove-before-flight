/**
 * Remove-before-flight Vite plugin.
 * Strips code between // @remove-before-flight markers only during build.
 */

import type { Plugin } from 'vite'
import { stripRemoveBeforeFlight } from './transform'

const SUPPORTED_EXT_RE = /\.(ts|js|mjs|cjs|vue)(\?.*)?$/

const SFC_BLOCK_RE = {
    script: /(<script[^>]*>)([\s\S]*?)(<\/script>)/gi,
    template: /(<template[^>]*>)([\s\S]*?)(<\/template>)/gi,
} as const

const isVueFile = (id: string): boolean =>
    id.endsWith('.vue') || id.includes('.vue?')

function createSfcBlockReplacer(useHtmlMarker: boolean) {
    return (_: string, openTag: string, content: string, closeTag: string): string => {
        const stripped = stripRemoveBeforeFlight(content, useHtmlMarker)
        return `${openTag}${stripped}${closeTag}`
    }
}

const stripScriptBlock = createSfcBlockReplacer(false)
const stripTemplateBlock = createSfcBlockReplacer(true)

function transformVueSfc(code: string): string {
    return code
        .replace(SFC_BLOCK_RE.script, stripScriptBlock)
        .replace(SFC_BLOCK_RE.template, stripTemplateBlock)
}

function transformJsOrTs(code: string): string {
    return stripRemoveBeforeFlight(code, false)
}

const TRANSFORM_BY_FILE = {
    vue: transformVueSfc,
    default: transformJsOrTs,
} as const

export function removeBeforeFlightPlugin(): Plugin {
    return {
        name: 'nuxt-remove-before-flight',
        apply: 'build',
        transform(code, id) {
            if (!code || typeof code !== 'string') return null
            if (!SUPPORTED_EXT_RE.test(id)) return null

            const transform = isVueFile(id) ? TRANSFORM_BY_FILE.vue : TRANSFORM_BY_FILE.default
            return { code: transform(code), map: null }
        },
    }
}
