# Sauly — self-contained build

`index.html` is the entire Meeting Buddy app inlined into one file (CSS, JS
and brand SVGs as data URIs). No build step, no external files, no server
required.

- **Open locally:** double-click `index.html`, or serve the folder
  (`python3 -m http.server`) and visit it.
- **Deploy anywhere static:** drag this folder onto vercel.com/new, a Netlify
  drop, GitHub Pages, S3, etc. It renders and works identically to the
  multi-file source in `../`.

Regenerate from source with the bundle script (concatenates `../*.js`,
inlines `../styles.css`, and embeds `../assets/*.svg` as data URIs).
