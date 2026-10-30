// Build-time loader: scans every content page and extracts each feature (## heading)
// plus its one-line summary (the blockquote right below it). Powers the Feature Index
// and the home page map, so they never go out of sync with the content.
import { createContentLoader } from 'vitepress'
import { sections } from './.vitepress/sections'

export interface Feature {
  title: string
  link: string
  summary: string
  extra: boolean
}

export interface PageFeatures {
  text: string
  link: string
  features: Feature[]
}

export interface SectionFeatures {
  text: string
  icon: string
  description: string
  pages: PageFeatures[]
}

declare const data: SectionFeatures[]
export { data }

// Mirrors VitePress' heading slugify so the generated anchors match the real ones.
const rControl = /[\u0000-\u001f]/g
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g
const rCombining = /[̀-ͯ]/g
function slugify(str: string): string {
  return str
    .normalize('NFKD')
    .replace(rCombining, '')
    .replace(rControl, '')
    .replace(rSpecial, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
}

function plain(markdown: string): string {
  return markdown
    .split('`')
    // even segments are prose (strip HTML like <Badge />), odd ones are code spans (keep <T>)
    .map((part, i) => (i % 2 === 0 ? part.replace(/<[^>]+>/g, '') : part))
    .join('')
    .replace(/\*\*|__/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\\</g, '<')
    .replace(/\\>/g, '>')
    .trim()
}

function extractFeatures(src: string, pageLink: string): Feature[] {
  const lines = src.split(/\r?\n/)
  const features: Feature[] = []
  let inFence = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    if (inFence || !line.startsWith('## ')) continue

    const raw = line.slice(3)
    const title = plain(raw)
    const extra = raw.includes('<Badge')

    let summary = ''
    for (let j = i + 1; j < lines.length && j < i + 6; j++) {
      if (lines[j].startsWith('> ')) {
        summary = plain(lines[j].slice(2))
        break
      }
    }

    features.push({ title, link: `${pageLink}#${slugify(title)}`, summary, extra })
  }
  return features
}

export default createContentLoader(['*/**/*.md'], {
  includeSrc: true,
  transform(raw): SectionFeatures[] {
    const byUrl = new Map(raw.map((page) => [page.url.replace(/\.html$/, ''), page]))

    return sections.map((section) => ({
      text: section.text,
      icon: section.icon,
      description: section.description,
      pages: section.items.map((item) => {
        const page = byUrl.get(item.link)
        return {
          text: item.text,
          link: item.link,
          features: page?.src ? extractFeatures(page.src, item.link) : []
        }
      })
    }))
  }
})
