# VPS Provider Comparison

[![Live site](https://img.shields.io/badge/live-lambdamax.github.io%2Fvps--catalog-0b6b4f)](https://lambdamax.github.io/vps-catalog/)
[![Pages deploy](https://github.com/lambdamax/vps-catalog/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/lambdamax/vps-catalog/actions/workflows/pages/pages-build-deployment)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/lambdamax/vps-catalog)](https://github.com/lambdamax/vps-catalog/commits/main)
![HTML](https://img.shields.io/badge/HTML-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![No build step](https://img.shields.io/badge/build-none-lightgrey)

A single-page comparison of SSD and NVMe VPS plans from Vultr, DigitalOcean, Linode (Akamai), Hetzner, Hostinger and OVHcloud at five levels:

| Level | Plan shown per provider | Typical use |
|---|---|---|
| L1 Entry | Cheapest plan | Tests, a static site, a small bot |
| L2 | Cheapest with at least 2 GB RAM | Small web app, WordPress |
| L3 | Cheapest with at least 4 GB RAM | AI agent runtime, n8n, small database |
| L4 | Cheapest with at least 8 GB RAM | Several containers, CI runner |
| L5 | Cheapest with at least 16 GB RAM | Many services, larger databases |

It is one interactive dashboard. A line chart of the lowest price per level (log scale), insights for the selected level and a map of each provider's data centers sit in one row, above a plan table with price bars and a $/GB RAM column. Hovering a provider in any of them highlights it everywhere, and clicking pins it. On desktop the whole dashboard fits one screen. Notes and sources sit behind the "Notes & sources" button.

**Live page:** https://lambdamax.github.io/vps-catalog/

Prices are in USD per month and were last checked on Oct 27, 2026. Providers change prices and promotions often, so confirm on the provider's own pricing page before ordering.

## Files

- `index.html`: the page and the plan table for all five levels (the chart and insights read their data from this table)
- `assets/style.css`: styles, with light and dark themes
- `assets/app.js`: level selector, chart, insights, map pins, linked highlighting, filters, search, motion, theme toggle
- `assets/map-data.js`: world outline, map region views and data center sites per provider

The site is static, with no build step. Open `index.html` directly or serve the folder with any static server, for example `python3 -m http.server`.

## Updating

- Change a plan: edit its row in the table in `index.html`, including the `data-` attributes (`data-tier`, `data-p` provider key, `data-s` storage, `data-price`, `data-cpu`, `data-ram`, `data-prepay`, and `data-renew` when there is a renewal price). The chart and insights use these attributes. Keep rows sorted by price within each level.
- Add or move a data center: edit `sites` in `assets/map-data.js`. Each entry is `[label, x, y, approx]` in map coordinates (viewBox `0 0 960 500`). Set `approx` to `1` when only the country is known, which draws a ring instead of a dot.

## License

[MIT](LICENSE)
