# rishabh-jindal.github.io

Personal site built from my resume. One static page, no build step.

## Publish on GitHub Pages

1. Create a public repo named `<your-github-username>.github.io`.
2. Put `index.html` and `resume.pdf` in the repo root and push to `main`.
3. In the repo, open **Settings → Pages**, set **Source** to "Deploy from a branch", branch `main`, folder `/ (root)`.
4. The site goes live at `https://<your-github-username>.github.io` within a minute or two.

## Updating

- Replace `resume.pdf` whenever the resume changes (keep the same file name).
- Text lives directly in `index.html`. The numbered evidence notes in the hero are in the `<aside class="sources">` block. Each note's "Show in experience" button points at a bullet `id` (`ev-1`, `ev-4`, ...).
