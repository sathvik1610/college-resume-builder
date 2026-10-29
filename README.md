# College Resume Builder

A resume builder for students. It produces plain, single-column resumes that applicant tracking systems (ATS) parse correctly, and it runs entirely in the browser. There is no server, no account and no tracking.

## What it does

- Two templates, Classic (serif) and Modern (sans-serif). Both are single column with real text headings. No tables, icons, photos or graphics.
- Sections suited to students: Education first, then Skills, Projects, Internships, Certifications, Achievements, Leadership. Sections can be reordered and empty ones disappear.
- Live preview with a page counter and A4 / US Letter paper.
- "Resume check" panel: missing contact details, resumes over one page, long bullets, bullets without numbers.
- Several resumes per browser (for example one for internships and one for core roles).
- Autosaves to `localStorage`. Export and import a JSON backup, or export plain text.
- Installable and offline after the first visit (service worker plus web manifest).
- Download PDF uses the browser print dialog, so the PDF keeps selectable text.

## Run it

No build step.

```bash
python -m http.server 8000
```

Open http://localhost:8000. Any static host works, including GitHub Pages.

## Brand it for your college

Edit `js/config.js`: college name, location and the degree suggestions. The first Education entry is pre-filled from it.

## Saving a good PDF

In the print dialog choose **Save as PDF**, set margins to **Default**, and turn off **Headers and footers**.

## Notes for contributors

- Keep resume output free of tables, columns, images and icon fonts. That is the point of the tool.
- System fonts only, so the tool works offline.
- When you change any cached file, bump `VERSION` in `sw.js` so users get the update.

## Project layout

```
index.html            app shell
css/app.css           editor UI
css/resume.css        resume and print styles
js/config.js          college settings
js/app.js             data, editor, rendering, storage
sw.js                 offline cache
manifest.webmanifest  install metadata
```
