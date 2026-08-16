<script setup lang="ts">
const route = useRoute()
const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('content').path(route.path).first())
</script>

<template>
  <main v-if="page">
    <ContentRenderer :value="page" />
  </main>
  <p v-else>
    Page not found.
  </p>
</template>
