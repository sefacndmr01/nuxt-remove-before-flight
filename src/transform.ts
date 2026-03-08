/**
 * Marker strings that flag code for removal during build only.
 * In dev, code runs as-is; in build, marked lines/blocks are stripped.
 */
const MARKERS = {
    js: '// @remove-before-flight',
    html: '<!-- @remove-before-flight -->',
} as const

export const REMOVE_BEFORE_FLIGHT_MARKER = MARKERS.js
export const REMOVE_BEFORE_FLIGHT_HTML_MARKER = MARKERS.html

type MarkerKind = keyof typeof MARKERS

const LINE_CHECKERS: Record<MarkerKind, (line: string) => boolean> = {
    js: (line) => line.includes(MARKERS.js),
    html: (line) => line.includes(MARKERS.html),
}

/**
 * Returns whether a line contains the JS/TS remove-before-flight marker.
 */
export function lineHasJsMarker(line: string): boolean {
    return LINE_CHECKERS.js(line)
}

/**
 * Returns whether a line contains the HTML remove-before-flight marker (e.g. Vue template).
 */
export function lineHasHtmlMarker(line: string): boolean {
    return LINE_CHECKERS.html(line)
}

/**
 * Collects 0-based line indices where the given marker appears.
 */
function findMarkerIndices(
    lines: string[],
    isMarker: (line: string) => boolean
): number[] {
    const indices: number[] = []
    for (let i = 0; i < lines.length; i++) {
        if (isMarker(lines[i])) indices.push(i)
    }
    return indices
}

/**
 * Builds the set of line indices to remove:
 * - Pairs of markers → block (first through second, inclusive).
 * - Unpaired marker → single line (that line + next line).
 */
function indicesToRemove(markerIndices: number[], lineCount: number): Set<number> {
    const toRemove = new Set<number>()
    let k = 0

    while (k < markerIndices.length) {
        const i = markerIndices[k]
        const j = markerIndices[k + 1]

        if (j !== undefined) {
            for (let row = i; row <= j; row++) toRemove.add(row)
            k += 2
            continue
        }

        toRemove.add(i)
        if (i + 1 < lineCount) toRemove.add(i + 1)
        k += 1
    }

    return toRemove
}

/**
 * Strips remove-before-flight marked code from the given source string.
 * @param code - Source code to process.
 * @param useHtmlMarker - If true, use HTML comment marker (e.g. Vue template); otherwise JS/TS.
 * @returns Processed code with marked regions removed.
 */
export function stripRemoveBeforeFlight(
    code: string,
    useHtmlMarker = false
): string {
    if (!code) return code

    const kind: MarkerKind = useHtmlMarker ? 'html' : 'js'
    const isMarker = LINE_CHECKERS[kind]
    const lines = code.split('\n')
    const markerIndices = findMarkerIndices(lines, isMarker)

    if (markerIndices.length === 0) return code

    const toRemove = indicesToRemove(markerIndices, lines.length)
    return lines
        .filter((_, idx) => !toRemove.has(idx))
        .join('\n')
}
