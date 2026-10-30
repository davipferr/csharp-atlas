---
layout: home

hero:
  name: C# Atlas
  text: Every C# feature, at a glance.
  tagline: A map of what the language can do — short explanations, real-world examples and when to reach for each feature.
  image:
    src: /logo.svg
    alt: C# Atlas
  actions:
    - theme: brand
      text: Browse the Feature Index
      link: /features
    - theme: alt
      text: Start from the top
      link: /fundamentals/dotnet-and-projects
---

<div class="map-intro">
  <h2>The map</h2>
  <p>Pick a region. Every page lists its features in the right-hand outline, and <kbd>Ctrl</kbd> + <kbd>K</kbd> searches everything.</p>
</div>

<SectionMap />

<style>
.map-intro {
  max-width: 1152px;
  margin: 48px auto 20px;
  padding: 0 24px;
}
.map-intro h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 6px;
}
.map-intro p {
  color: var(--vp-c-text-2);
  margin: 0;
}
.map-intro kbd {
  font-size: 12px;
  padding: 1px 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
}
@media (max-width: 640px) {
  .map-intro { padding: 0 16px; }
}
</style>
