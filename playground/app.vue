<template>
    <div>
        <h1>Remove Before Flight — Playground</h1>
        <p>Message: {{ message }}</p>
        <p v-if="devMessage">Dev-only: {{ devMessage }}</p>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const message = 'Hello from Nuxt'
const devMessage = ref('')

// @remove-before-flight
devMessage.value = 'This line is stripped in build (single-line)'
</script>
