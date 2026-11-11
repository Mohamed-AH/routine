# Our Family Day

A picture-based routine board for the family. It's built so the kids (ages 4 to 8) can follow it from the pictures alone.

- **Today**: the sun moves across a sky arc through the day's timed steps. A big "Right now" card shows the current step, and the full plan runs below as a path you tick off.
- **Kids' jobs**: a sticker sheet for each child (Huud, Dua, Joury). Tapping a job adds a star to the child's star jar.
- **Grown-ups**: a notebook list with tick boxes for each adult.
- **Arrange & edit**: drag to reorder steps and jobs (or move a job to another child), set or clear times, limit steps to certain days, and rename anything.
- **Themes**: Zellige, Sticker book, Lantern night, Chalkboard and Riso print.

Everything is stored once in Cloudflare Workers KV, so every phone and tablet shows the same routine and the same stars. Stars reset each day.

## Files

| Path | What it is |
| --- | --- |
| `public/index.html` | The whole app (HTML, CSS and JS in one file) |
| `src/worker.js` | Small API that saves the routine and the day's ticks to KV |
| `wrangler.toml` | Cloudflare config: the Worker, the static files and the KV binding |

## Deploy on Cloudflare (from GitHub, no installs)

1. **Create the storage.** In the Cloudflare dashboard, go to **Storage & Databases → KV → Create**, name it `routine`, and copy its **ID**.
2. **Paste the ID.** On GitHub, edit `wrangler.toml` and replace `PASTE_YOUR_KV_ID_HERE` with that ID. Commit to `main`.
3. **Connect the repo.** Go to **Workers & Pages → Create → Import a repository**, pick `routine`, and keep the default deploy command (`npx wrangler deploy`). Press **Deploy**.
4. **Optional PIN.** In the Worker, go to **Settings → Variables and Secrets → Add**, choose type **Secret**, set the name to `FAMILY_PIN` and enter any number. Anyone opening the app then needs the PIN once per device.
5. **Open it** at `https://family-day.<your-subdomain>.workers.dev` and use "Add to Home Screen" on the kids' tablet.

After this, every push to `main` redeploys automatically.

## Deploy from your computer instead

```
npm install
npx wrangler login
npx wrangler kv namespace create ROUTINE   # paste the printed id into wrangler.toml
npx wrangler deploy
npx wrangler secret put FAMILY_PIN         # optional
```

Run it locally with `npx wrangler dev`.

## API

| Method | Path | Does |
| --- | --- | --- |
| GET | `/api/plan` | Returns the saved routine, or `null` before the first save |
| PUT | `/api/plan` | Saves `{ plan }` |
| GET | `/api/ticks/YYYY-MM-DD` | Returns `{ done: { id: true } }` for that day |
| POST | `/api/ticks/YYYY-MM-DD` | Ticks or unticks one item: `{ id, on }` |
| PUT | `/api/ticks/YYYY-MM-DD` | Clears that day's ticks |

When `FAMILY_PIN` is set, every request must send the header `x-family-pin`.
