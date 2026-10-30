import { defineConfig } from 'vitepress'
import { sections } from './sections'

export default defineConfig({
  title: 'C# Atlas',
  description: 'A map of C# features: short explanations, real-world examples and when to use each one.',
  lang: 'en-US',
  // GitHub Pages serves the site at https://<user>.github.io/csharp-atlas/
  base: '/csharp-atlas/',
  lastUpdated: true,

  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/csharp-atlas/logo.svg' }]],

  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
    lineNumbers: false
  },

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Feature Index', link: '/features' },
      { text: 'Start', link: '/fundamentals/dotnet-and-projects' }
    ],

    sidebar: [
      {
        text: 'Overview',
        items: [{ text: 'Feature Index', link: '/features' }]
      },
      ...sections.map((section) => ({
        text: `${section.icon} ${section.text}`,
        collapsed: false,
        items: section.items
      }))
    ],

    outline: { level: 2, label: 'Features on this page' },

    search: { provider: 'local' },

    docFooter: { prev: 'Previous', next: 'Next' },

    footer: {
      message: 'Personal C# reference built from my course notes.',
      copyright: 'C# Atlas'
    }
  }
})
