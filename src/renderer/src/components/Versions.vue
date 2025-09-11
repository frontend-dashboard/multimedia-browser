<script setup>
import { reactive } from 'vue'

// 使用我们在preload中正确暴露的process.versions
const versions = reactive({ ...(window.electron?.process?.versions || { electron: '', chrome: '', node: '' }) })
</script>

<template>
  <ul class="versions">
    <li class="electron-version">Electron v{{ versions.electron }}</li>
    <li class="chrome-version">Chromium v{{ versions.chrome }}</li>
    <li class="node-version">Node v{{ versions.node }}</li>
  </ul>
</template>
