<script setup>
import BaseLayout from './BaseLayout.vue'
import NavBar from '@renderer/components/NavBar.vue'
</script>

<template>
  <BaseLayout>
    <template #header>
      <NavBar />
    </template>
  </BaseLayout>
</template>

<style scoped>
.main-content {
  height: calc(100vh - 68px);
}
</style>
