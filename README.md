# C# Atlas

A map of C# features: short explanations, real-world examples and when to use each one.
Built from my C# course notes as a quick-recall reference for a mid-level developer, not a tutorial.

**Live site:** `https://<your-github-user>.github.io/csharp-atlas/`

## Stack

- [VitePress](https://vitepress.dev): static site generator for Markdown docs
- Local full-text search (Ctrl + K), dark mode and mobile layout out of the box
- Deployed to GitHub Pages by GitHub Actions on every push to `main`

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173/csharp-atlas/
npm run build     # output in docs/.vitepress/dist
npm run preview   # serve the production build
```

## Deploy (first time)

1. Create a GitHub repo named **`csharp-atlas`** and push this project to `main`.
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. The `Deploy to GitHub Pages` workflow runs on every push. The site shows up at `https://<user>.github.io/csharp-atlas/`.

If you rename the repo, update `base` in `docs/.vitepress/config.mts` to match.

## Project structure

```text
docs/
├── .vitepress/
│   ├── config.mts          ← site config (title, base path, nav, search)
│   ├── sections.ts         ← sidebar structure: the single source of truth for pages
│   └── theme/              ← brand colors + Vue components (home map, feature index)
├── features.data.ts        ← build-time loader that extracts every feature from the pages
├── index.md                ← home page
├── features.md             ← auto-generated Feature Index
└── <section>/<page>.md     ← content
```

## Adding content

Each page is a Markdown file where **every `##` heading is one feature**, followed by a one-line summary blockquote:

````md
## Feature Name

> One sentence: what it is.

Explanation…

```csharp
// realistic example
```

::: tip When to use
- Real scenario where this feature fits
:::
````

- The Feature Index and home page counters update automatically from the `##` headings and `>` summaries.
- Add `<Badge type="tip" text="extra" />` to a heading for features beyond the original course.
- New page? Create the `.md` file and add it to `docs/.vitepress/sections.ts`.
- Always put generic types in backticks (`` `List<T>` ``). Outside code, `<T>` is parsed as an HTML tag.
