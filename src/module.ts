import { addVitePlugin, defineNuxtModule } from '@nuxt/kit'
import { removeBeforeFlightPlugin } from './plugin'

export interface ModuleOptions {
    /**
     * Enable the module. Default: true.
     */
    enabled?: boolean
}

const DEFAULTS: Required<Pick<ModuleOptions, 'enabled'>> = {
    enabled: true,
}

export default defineNuxtModule<ModuleOptions>({
    meta: {
        name: 'nuxt-remove-before-flight',
        configKey: 'removeBeforeFlight',
        compatibility: {
            nuxt: '^3.0.0 || ^4.0.0',
        },
    },
    defaults: DEFAULTS,
    setup(options) {
        if (!options.enabled) return

        addVitePlugin(removeBeforeFlightPlugin(), { build: true })
    },
})
