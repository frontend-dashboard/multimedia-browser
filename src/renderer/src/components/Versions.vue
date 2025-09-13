<script setup>
import { reactive } from 'vue'

// 使用我们在preload中正确暴露的process.versions
const versions = reactive({
  ...(window.electron?.process?.versions || { electron: '', chrome: '', node: '' })
})
</script>

<template>
  <div class="versions">
    <div class="electron-version">Electron v{{ versions.electron }}</div>
    <div class="chrome-version">Chromium v{{ versions.chrome }}</div>
    <div class="node-version">Node v{{ versions.node }}</div>
  </div>
</template>
