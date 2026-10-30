<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import { data } from '../../../features.data'

const query = ref('')

const total = computed(() =>
  data.reduce((n, s) => n + s.pages.reduce((m, p) => m + p.features.length, 0), 0)
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return data
  return data
    .map((section) => ({
      ...section,
      pages: section.pages
        .map((page) => ({
          ...page,
          features: page.features.filter(
            (f) =>
              f.title.toLowerCase().includes(q) ||
              f.summary.toLowerCase().includes(q) ||
              page.text.toLowerCase().includes(q)
          )
        }))
        .filter((page) => page.features.length > 0)
    }))
    .filter((section) => section.pages.length > 0)
})

const shown = computed(() =>
  filtered.value.reduce((n, s) => n + s.pages.reduce((m, p) => m + p.features.length, 0), 0)
)
</script>

<template>
  <div class="feature-index">
    <div class="filter">
      <input
        v-model="query"
        type="search"
        placeholder="Filter features… (e.g. ref, async, sealed, dictionary)"
        aria-label="Filter features"
      />
      <span class="count">{{ shown }} / {{ total }} features</span>
    </div>

    <section v-for="section in filtered" :key="section.text" class="section">
      <h2 class="section-title">
        <span aria-hidden="true">{{ section.icon }}</span> {{ section.text }}
      </h2>
      <div v-for="page in section.pages" :key="page.link" class="page">
        <a class="page-title" :href="withBase(page.link)">{{ page.text }}</a>
        <ul>
          <li v-for="feature in page.features" :key="feature.link">
            <a :href="withBase(feature.link)">{{ feature.title }}</a>
            <span v-if="feature.extra" class="extra">extra</span>
            <span v-if="feature.summary" class="summary"> — {{ feature.summary }}</span>
          </li>
        </ul>
      </div>
    </section>

    <p v-if="shown === 0" class="empty">No feature matches “{{ query }}”.</p>
  </div>
</template>

<style scoped>
.filter {
  position: sticky;
  top: calc(var(--vp-nav-height) + 8px);
  z-index: 5;
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  background: var(--vp-c-bg);
}
.filter input {
  flex: 1;
  min-width: 0;
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  font-size: 15px;
}
.filter input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}
.count {
  font-size: 13px;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}
.section-title {
  border-top: 1px solid var(--vp-c-divider);
  margin-top: 32px !important;
  padding-top: 24px !important;
}
.page {
  margin: 16px 0 8px;
}
.page-title {
  font-weight: 600;
  font-size: 17px;
}
.page ul {
  margin: 6px 0 0;
}
.page li {
  margin: 4px 0;
}
.summary {
  color: var(--vp-c-text-2);
  font-size: 14px;
}
.extra {
  display: inline-block;
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  color: var(--vp-c-green-1);
  background: var(--vp-c-green-soft);
}
.empty {
  color: var(--vp-c-text-2);
}
</style>
