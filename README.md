# hotdaw.gs

Website for Hot Dawg Assassins, hosted on GitHub Pages. Pushing to `master` updates the live site within a minute or two.

The site has three pages, each in English and Welsh:

- **Home** (hotdaw.gs, /cy/): upcoming gigs, video, photos, reviews and booking.
- **Past gigs** (/past-gigs/, /cy/past-gigs/), with flyers and photos.
- **Promo kit** (/promo/, /cy/promo/): posters, social images, logos and band text for promoters. Send promoters this link.

## Add a gig

1. Open `_data/gigs.yml` on GitHub and click the pencil icon to edit.
2. Add a block like this at the bottom (spacing matters: two spaces before each line after the first):

   ```yaml
   - date: 2026-12-06
     venue: The Belle Vue
     town: Bangor
     time: 9pm
     price: Free entry
     link: https://www.facebook.com/events/...
   ```

   Only `date` and `venue` are required, but add the `town` so the Directions button finds the right place. Old gigs go in the same file.
3. Click **Commit changes**.

Once the date has passed, the gig leaves the home page and shows on the Past gigs page by itself.

## Add photos

Upload photos to the `images` folder first (on GitHub: open `images`, then **Add file → Upload files**).

Photos straight from a phone can include where they were taken, and anyone can download the files on this site. On an iPhone, tap **Options** on the share sheet and turn off **Location** before saving or sending the photo you'll upload. On a Mac, `tools/images/strip.swift` removes it (see `tools/README.md`).

- **Photos from a past gig:** list them under that gig in `_data/gigs.yml`:

  ```yaml
    photos:
      - Skerries.jpg
  ```

  They show as small pictures under the gig. For a faster page, also upload a small copy (about 360 × 240) with the same name to `images/thumbs`.
- **A gig's flyer or poster:** add `flyer: WinterFolk_2023.jpg` to that gig. It shows whole, before any photos. A small copy in `images/thumbs` (about 240 wide) keeps the page fast.
- **New photos for the Photos section** (free for promoters to use): add them under `photos:` in `_data/band.yml`, with their width and height in pixels.
- **The face behind "Book us"** is `images/bg.jpg`. The site darkens and fades it. To use a different picture, replace that file and keep the name.

## Promo kit

The files are in the `promo` folder, with small previews in `promo/thumbs`. What's listed, and the wording, is in `_data/promo.yml`. The band text promoters can copy is `bio` in `_data/band.yml`.

To add a file, put it in `promo`, a preview of about 400 px in `promo/thumbs`, and a block in `_data/promo.yml` like the others.

The posters and social images are made from layouts in `tools/promo`. To change their wording or photos, or to remake the logos, see `tools/README.md`.

## Welsh pages

Every page has a Welsh version under /cy/.

- Menu labels, buttons and other fixed wording are in `_data/text.yml`, under `en` and `cy`.
- In `band.yml`, `gigs.yml` and `promo.yml`, a field ending in `_cy` (for example `notes_cy`) is the Welsh version. If it's missing, the Welsh page shows the English.

## Change band details

The short bio under the band name (`intro`), email address, social links, videos and booking info are in `_data/band.yml`.

## Preview locally

```sh
gem install jekyll
jekyll serve
```

Then open http://localhost:4000.

## Check it in every browser before publishing

The tests open every page in Chrome's engine (Chromium), Firefox and Safari's (WebKit), at phone, tablet and desktop widths. They check:

- the pages load without errors or sideways scrolling, and every image arrives;
- the language switches go to the matching page;
- the photo viewer, the past gigs page and every promo kit download work;
- the "Book us" section looks the same as its approved pictures in `tests/site.spec.js-snapshots`.

First time only:

```sh
npm install
npx playwright install chromium firefox webkit
```

Then, each time:

```sh
jekyll build
npm test
```

If you change how "Book us" looks on purpose, check the new look and then run `npx playwright test --update-snapshots` to approve it.

On some Macs, Playwright's Firefox won't start ("Could not find profile folder"). That's a problem with the test browser, not the site. Run the other two with `npm test -- --project=chromium --project=webkit` until a Playwright update fixes it.
