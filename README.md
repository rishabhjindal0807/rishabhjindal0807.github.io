# rishabhjindal0807.github.io

Personal site built from my resume: static HTML, Tailwind CSS v4 and plain JavaScript, hosted on GitHub Pages.

Live at **https://rishabhjindal0807.github.io**

## What's in it

- Light and dark mode (follows the system setting, remembers the visitor's choice; `dark:` variant is wired to `data-theme`)
- Hero answer that streams in like an AI response, with citation markers that open the evidence
- Pointer-reactive dot field, drifting light and card spotlights (switched off for touch and reduced-motion users)
- Interactive, animated OptimaAI architecture diagram
- Scroll-driven experience timeline, skill tabs, ⌘K / Ctrl+K command menu

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The page, styled with Tailwind utility classes |
| `src/styles.css` | Tailwind source: design tokens, theme colours, motion components |
| `assets/site.css` | Compiled, minified stylesheet that the page loads (commit it after building) |
| `assets/site.js` | All interactions and animation |
| `Rishabh-Jindal-Lead-Software-Engineer.pdf` | The download linked from the page |

## Editing

```bash
npm install
npm run dev     # rebuilds assets/site.css on every change
npm run build   # one-off minified build before committing
```

To show your email on the page, set `CONTACT_EMAIL` at the top of `assets/site.js`. While it's empty, LinkedIn is the main contact button.

Replace `Rishabh-Jindal-Lead-Software-Engineer.pdf` whenever the resume changes (keep the same file name).
