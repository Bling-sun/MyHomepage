# MyHomepage

Personal academic homepage of **Bing Sun (孙冰)**.

[Website](https://bling-sun.github.io/MyHomepage/) · [CV](https://bling-sun.github.io/MyHomepage/cv.html)

English / Chinese · Light / dark themes · Project demos · Printable CV

## Update

Edit `content.json` to update the profile, publications, projects, and bilingual text. Store demo images and videos in `assets/demos/` and reference them in each entry's `media` array.

Regenerate the pages with Node.js:

```bash
node scripts/build.mjs
```

The homepage's **View CV** link opens `cv.html`, which displays the original Chinese resume using page images so it works without a browser PDF plugin. The **Download CV** button is available on that preview page and downloads `assets/Bing-Sun-CV.pdf`.

After replacing that PDF, regenerate its preview images with Poppler before building:

```bash
pdftoppm -jpeg -scale-to 1800 -jpegopt quality=88 assets/Bing-Sun-CV.pdf assets/cv/page
node scripts/build.mjs
```

Remove any obsolete `assets/cv/page-*.jpg` files if the new PDF has fewer pages.

## Preview

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [localhost:8000](http://127.0.0.1:8000/).

## Deploy

GitHub Pages serves the repository root on `main`. Commit the content, assets, and generated `index.html` / `cv.html`, then push to publish.
