# VintageOverMedium — GitHub Pages Demo

Straight HTML/CSS/vanilla JS demo package. Upload the contents of this folder to the repository root.

## Current demo pages
- Home
- Special Event Dresses
- 1950s Swing Dresses
- 1920s Gatsby Dresses
- Vintage Size Guide
- About
- Affiliate Disclosure
- Privacy
- Terms
- Private How It Works demo page

## Demo affiliate system
Product cards are rendered from `assets/products.json`. Demo mode intercepts fake affiliate clicks and shows estimated commission instead of opening the fake URL. Every placeholder affiliate URL contains `DEMO`.

Before launch, replace product data and images with approved retailer assets and real affiliate links, then set `demoMode` to `false` and remove or protect the private demo page.

## GitHub Pages
All site navigation and assets use project-safe relative paths so the package works from a repository subfolder as well as a custom domain.
