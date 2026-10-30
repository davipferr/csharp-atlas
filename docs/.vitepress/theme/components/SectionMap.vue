<script setup lang="ts">
import { withBase } from 'vitepress'
import { data } from '../../../features.data'

const count = (pages: { features: unknown[] }[]) =>
  pages.reduce((n, p) => n + p.features.length, 0)
</script>

<template>
  <div class="section-map">
    <a
      v-for="section in data"
      :key="section.text"
      class="card"
      :href="withBase(section.pages[0].link)"
    >
      <div class="head">
        <span class="icon" aria-hidden="true">{{ section.icon }}</span>
        <span class="count">{{ count(section.pages) }} features</span>
      </div>
      <h3>{{ section.text }}</h3>
      <p>{{ section.description }}</p>
      <ul>
        <li v-for="page in section.pages" :key="page.link">{{ page.text }}</li>
      </ul>
    </a>
  </div>
</template>

<style scoped>
.section-map {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px 64px;
}
.card {
  display: block;
  padding: 20px;
  border: 1px solid var(--vp-c-bg-soft);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s;
}
.card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.icon {
  font-size: 26px;
}
.count {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 2px 8px;
  border-radius: 999px;
}
h3 {
  margin: 12px 0 6px;
  font-size: 18px;
  font-weight: 600;
}
p {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}
ul {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}
li {
  margin: 2px 0;
}
@media (max-width: 640px) {
  .section-map {
    padding: 0 16px 48px;
  }
}
</style>
