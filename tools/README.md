# Tools

Everything used to make the site's images, so they can be changed or remade later.
None of this is published: `_config.yml` keeps the `tools` folder off the live site.
Run the commands from the repo root.

## Promo kit images (`promo/`)

The posters, event cover, square post and story are web pages in `tools/promo/`, one per image,
laid out at the image's shape. `kit.css` has the shared look. Their words (the band name, the
tagline in Welsh and English, the web address and Instagram handle) are in the .html files.

To change one, edit its .html file, then remake them all:

```sh
npm install                          # first time only
npx playwright install chromium      # first time only
node tools/promo/render.js           # writes promo/*.jpg and the previews in promo/thumbs
```

To compare before replacing the live files, write somewhere else first:
`node tools/promo/render.js some/folder`.

The layouts use the photos in `images/`, the face in `images/bg.jpg`, the fade in
`assets/spot-mask.svg` and the font in `tools/fonts/`. If you rename a photo, update the
`src=` in the layout that uses it.

## Logos (`promo/hot-dawg-assassins-logo-*`)

`tools/logo/logo.swift` draws the band name in the site's lettering (Archivo, Extra Condensed
Black) and saves an SVG of the letter shapes, which needs no font installed, plus a
transparent PNG. Mac only: it uses the Mac's built-in text drawing.

```sh
swiftc -O tools/logo/logo.swift -o /tmp/logo
/tmp/logo tools/fonts/Archivo.ttf promo/hot-dawg-assassins-logo-light EEE9E1 3000 left "HOT DAWG ASSASSINS"
/tmp/logo tools/fonts/Archivo.ttf promo/hot-dawg-assassins-logo-dark 161412 3000 left "HOT DAWG ASSASSINS"
/tmp/logo tools/fonts/Archivo.ttf promo/hot-dawg-assassins-logo-stacked-light EEE9E1 2000 center "HOT DAWG" "ASSASSINS"
/tmp/logo tools/fonts/Archivo.ttf promo/hot-dawg-assassins-logo-stacked-dark 161412 2000 center "HOT DAWG" "ASSASSINS"
```

The arguments are: font, output name (without .svg/.png), colour, PNG width in pixels,
alignment, then one argument per line of text.

## Photos (`images/`)

Both tools are Mac only. Build them once with `swiftc -O <file>.swift -o /tmp/<name>`.

- `tools/images/strip.swift` removes the location, camera, date and editing data from photos
  without re-saving the picture, so nothing about where it was taken goes public:
  `/tmp/strip <output-folder> <photo>...` writes clean copies into the output folder.
  Do this for every photo from a phone before it goes in `images/`.
- `tools/images/crop.swift` crops and resizes, for thumbnails and header crops:
  `/tmp/crop <in> <out.jpg> <x> <y> <w> <h> <outW> <outH> [quality]` (x and y from the top left).
  For example, a 360 × 240 thumbnail of a 1920 × 1280 photo:
  `/tmp/crop images/new.jpg images/thumbs/new.jpg 0 0 1920 1280 360 240`.

## Font

`tools/fonts/Archivo.ttf` is Archivo by the Archivo Project Authors, under the SIL Open Font
License (`tools/fonts/OFL.txt`), which allows using and sharing it like this. The site itself
loads the same font from Google Fonts.
