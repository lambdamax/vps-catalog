# VPS Provider Comparison

A single-page comparison of entry-level SSD and NVMe VPS plans from Vultr, DigitalOcean, Linode (Akamai), Hetzner, Hostinger and OVHcloud. It covers price, specs and bandwidth, and has an interactive map of each provider's data center locations.

**Live page:** https://lambdamax.github.io/vps-catalog/

Prices are in USD per month and were last checked on Oct 27, 2026. Providers change prices and promotions often, so confirm on the provider's own pricing page before ordering.

## Files

- `index.html`: the page and the price table
- `assets/style.css`: styles, with light and dark themes
- `assets/app.js`: map pins, provider and storage filters, search, theme toggle
- `assets/map-data.js`: world outline, map region views and data center sites per provider

The site is static, with no build step. Open `index.html` directly or serve the folder with any static server, for example `python3 -m http.server`.

## Updating

- Change a plan: edit its row in the table in `index.html`. Rows are sorted by entry price.
- Add or move a data center: edit `sites` in `assets/map-data.js`. Each entry is `[label, x, y, approx]` in map coordinates (viewBox `0 0 960 500`). Set `approx` to `1` when only the country is known, which draws a ring instead of a dot.
