# Daily Orbit — 20 November 2026

[![make.fun](https://make.fun/badge/news-image-20261120.svg)](https://make.fun/bounty/news-image-20261120)
[![rank](https://make.fun/badge/news-image-20261120/DLiiMaGaming/daily-orbit-20261120/rank.svg)](https://make.fun/bounty/news-image-20261120)
[![reward](https://make.fun/badge/news-image-20261120/DLiiMaGaming/daily-orbit-20261120/reward.svg)](https://make.fun/bounty/news-image-20261120)

A one-page newspaper front page summing up the world's news of Friday
20 November 2026: Kyiv hit by ballistic missiles, Houthi strikes on Saudi
targets, a tanker ablaze near the Strait of Hormuz, mystery drones shutting
Genoa airport, COP31 closing in Antalya, and Cyclone Akvan bearing down on
India — plus a ticker of three more stories from the same day.

## How it works

`main.ts` (Node 22, standard library only) draws the whole front page from
scratch — a 5x7 bitmap font, a small shape-drawing sheet, and a hand-rolled
PNG encoder — and writes it as `entry.png`. No network, no assets, no
randomness: two runs produce byte-identical output.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The result is a 1024x1024 PNG, well under the 1 MiB limit.

## Entry

Built for the [make.fun](https://make.fun/bounty/news-image-20261120)
competition `news-image-20261120` — "Sum up 20 November's world news in
one image".

## License

MIT — see [LICENSE](LICENSE).
