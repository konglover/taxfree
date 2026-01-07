<template>
  <div class="home">
    <div class="welcome-card">
      <h1>欢迎使用 TaxFree App</h1>
      <p>这是一个基于 Vue 3 + JavaScript 的前后端分离项目</p>
      <div class="tech-stack">
        <div class="tech-item">
          <h3>前端技术栈</h3>
          <ul>
            <li>Vue 3 (Composition API)</li>
            <li>JavaScript (ES6+)</li>
            <li>Vite</li>
            <li>Vue Router</li>
            <li>Pinia</li>
          </ul>
        </div>
        <div class="tech-item">
          <h3>后端技术栈</h3>
          <ul>
            <li>Node.js</li>
            <li>Express</li>
            <li>JavaScript (ES6+)</li>
            <li>SQLite</li>
            <li>better-sqlite3</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Vue 3 Composition API
</script>

<style scoped>
.home {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.welcome-card {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  width: 100%;
}

.welcome-card h1 {
  color: #667eea;
  margin-bottom: 1rem;
  font-size: 2.5rem;
}

.welcome-card > p {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.tech-stack {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
}

.tech-item h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.tech-item ul {
  list-style: none;
  padding: 0;
}

.tech-item li {
  padding: 0.5rem 0;
  color: #555;
  border-bottom: 1px solid #eee;
}

.tech-item li:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .tech-stack {
    grid-template-columns: 1fr;
  }
}
</style>

