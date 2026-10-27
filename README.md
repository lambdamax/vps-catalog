# VPS Provider Comparison

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![SVG](https://img.shields.io/badge/SVG-FFB13B?logo=svg&logoColor=black)
![Google Fonts](https://img.shields.io/badge/Google%20Fonts-4285F4?logo=googlefonts&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?logo=githubpages&logoColor=white)

A single-page comparison of SSD and NVMe VPS plans from Vultr, DigitalOcean, Linode (Akamai), Hetzner, Hostinger and OVHcloud at five levels:

| Level | Plan shown per provider | Typical use |
|---|---|---|
| L1 Entry | Cheapest plan | Tests, a static site, a small bot |
| L2 | Cheapest with at least 2 GB RAM | Small web app, WordPress |
| L3 | Cheapest with at least 4 GB RAM | AI agent runtime, n8n, small database |
| L4 | Cheapest with at least 8 GB RAM | Several containers, CI runner |
| L5 | Cheapest with at least 16 GB RAM | Many services, larger databases |

It is one interactive dashboard in a single panel: insight tiles for the selected level, a line chart of the lowest price per level (log scale) beside a data center map, and a plan table with price bars and a $/GB RAM column. Hovering a provider anywhere (line, legend, map dot, insight tile or table row) highlights it across the dashboard, and clicking pins it. Clicking a map dot (or the maximize button) opens the map in a large modal card that flies in to that spot; there dots magnify on hover, city names label the dots, with the providers at each spot once you zoom in (more labels appear as you zoom), and you can scroll or use + / − to zoom, drag to pan, click dots to fly closer, or jump to a region. Press Esc to exit. On desktop (900px wide and up) the page never scrolls; only the plan list scrolls inside when the window is short. Notes and sources sit behind the "Notes & sources" button. Motion respects the reduced-motion setting.

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
- After editing a file in `assets/`, change its `?v=` value in `index.html` (any new value, for example the first 8 characters of `shasum assets/style.css`) so browsers load the new version instead of a cached copy.

## License

[MIT](LICENSE)
