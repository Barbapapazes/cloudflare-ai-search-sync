<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <RouterLink to="/">
      Home
    </RouterLink>
    <RouterLink to="/guide/">
      Guide
    </RouterLink>
    <RouterLink to="/guide/introduction">
      Introduction
    </RouterLink>
  </header>
  <main>
    <RouterView />
  </main>
</template>
