# Qi Wang — Engineering & Visual Portfolio

Static, bilingual portfolio published at https://nidely.github.io/my-portfolio/.

- `index.html`: bilingual content, native project details and accessible dialogs.
- `assets/site.css`: responsive appearance and reduced-motion styles. No browser-side CSS compiler or external framework is required.
- `assets/site.js`: navigation, image viewing, settings dialogs and email copying.
- `assets/preferences.js`: timezone/browser language and local-time/system appearance logic. Existing manual choices are preserved. Defaults remain timezone language and 07:00–19:00 light appearance.
- `assets/previews/`: responsive WebP display images. The original files in `images/` are loaded when requested through the image viewer.
- `Resume_CN.pdf` and `Resume_EN.pdf`: separate resume downloads.

When changing `assets/preferences.js`, run `node scripts/sync-preferences.mjs` to update its early inline copy in `index.html`. This sets language and appearance before the first content paint.

For local preview, run `python -m http.server 8000` from this directory. GitHub Pages serves the checked-in files directly; no build or dependency installation is necessary.

Keep project dates and descriptions consistent between languages and resumes. Document only substantiated contributions and outcomes.
