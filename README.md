# hotdaw.gs

Website for Hot Dawg Assassins, hosted on GitHub Pages. Pushing to `master` updates the live site within a minute or two.

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

Once the date has passed, the gig moves to "Past gigs" by itself.

## Add photos

Upload photos to the `images` folder first (on GitHub: open `images`, then **Add file → Upload files**).

Photos straight from a phone can include where they were taken, and anyone can download the files on this site. On an iPhone, tap **Options** on the share sheet and turn off **Location** before saving or sending the photo you'll upload.

- **Photos from a past gig:** list them under that gig in `_data/gigs.yml`:

  ```yaml
    photos:
      - Skerries.jpg
  ```

  They show as small pictures under the gig. For a faster page, also upload a small copy (about 360 × 240) with the same name to `images/thumbs`.
- **A gig's flyer or poster:** add `flyer: WinterFolk_2023.jpg` to that gig. It shows whole, before any photos. A small copy in `images/thumbs` (about 240 wide) keeps the page fast.
- **New photos for the Photos section** (free for promoters to use): add them under `photos:` in `_data/band.yml`, with their width and height in pixels.

## Welsh page

The Welsh version is at hotdaw.gs/cy/. Both pages share one layout (`_layouts/home.html`).

- Menu labels, buttons and other fixed wording are in `_data/text.yml`, under `en` and `cy`.
- In `band.yml` and `gigs.yml`, a field ending in `_cy` (for example `notes_cy`) is the Welsh version. If it's missing, the Welsh page shows the English.

## Change band details

Email address, social links, videos and booking info are in `_data/band.yml`.

## Preview locally

```sh
gem install jekyll
jekyll serve
```

Then open http://localhost:4000.
