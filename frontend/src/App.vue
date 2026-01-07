<template>
  <div id="app">
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  margin: 0 auto;
}

.main-content {
  flex: 1;
  width: 100%;
}

/* 移动端适配 */
@media (min-width: 768px) {
  .main-content {
    max-width: 600px;
    margin: 0 auto;
    padding: 1rem;
  }
}
</style>

