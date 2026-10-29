# College Resume Builder

A resume builder for students, branded for IIT Tirupati. It produces plain, single-column resumes that applicant tracking systems (ATS) parse correctly, and it runs entirely in the browser. No server, no account, no tracking.

Live site: https://sathvik1610.github.io/college-resume-builder/

Built with React, TypeScript, Tailwind CSS and [shadcn/ui](https://ui.shadcn.com).

## What it does

- Two templates: Classic (LaTeX style, Computer Modern font) and Modern (sans-serif). Both are single column with real text headings. No tables, icons, photos or graphics.
- Sections for students: Education, Coursework, Skills, Projects, Internships, Certifications, Achievements, Leadership. Reorder them, rename their headings, and empty ones disappear.
- Any number of header links (LinkedIn, GitHub, portfolio, Scholar, LeetCode...).
- College logo in the header: official logo by default, or upload another.
- Live preview with real page breaks (multi-page resumes), zoom in/out, page counter, A4 or US Letter.
- Light and dark mode.
- Resume check: missing contact details, over one page, long bullets, bullets without numbers.
- Several resumes per browser. Autosaves to `localStorage`. Export and import JSON backups, or export plain text.
- Installable and works offline after the first visit (service worker via `vite-plugin-pwa`).
- Download PDF uses the browser print dialog, so the PDF keeps selectable text.

## Develop

```bash
npm install
npm run dev
```

Build for hosting (any static host, including GitHub Pages):

```bash
npm run build
```

The output in `dist/` uses relative paths, so it works from a sub-folder.

## Brand it for your college

- `src/config.ts`: college name, location and degree suggestions.
- `public/assets/logo.jpg`: the official logo. Replace the file to change it.
- `src/index.css`: the colour tokens (`--primary` is the maroon).

## Saving a good PDF

In the print dialog choose **Save as PDF**, and turn off **Headers and footers**.

## Notes for contributors

- Keep the resume output free of tables, columns, images and icon fonts. That is the point of the tool.
- The resume is rendered from `src/lib/render.ts` and styled by `src/styles/resume.css`. The editor UI is in `src/components/`.
- Fonts are bundled in `src/fonts/` (subset TrueType files) so the tool looks the same offline. The PDF exporter (`src/lib/pdf.ts`) measures the browser layout of the preview and draws the same text, rules and logo into the PDF, so the two always match.
