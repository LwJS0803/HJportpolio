# HJportfolio

Research portfolio website (static HTML/CSS/JS) for GitHub Pages.

## Live URL

- https://lwjs0803.github.io/HJportfolio/

## Tech Stack

- Vanilla HTML, CSS, JavaScript
- Data-driven rendering from `data/portfolio.json`
- No backend

## Project Structure

- `index.html`: portfolio page
- `styles.css`: all styles (desktop/tablet/mobile responsive)
- `app.js`: data loading + section rendering
- `data/portfolio.json`: single source of content
- `assets/`: profile and publication/conference images

## Content Update Guide

1. Edit `data/portfolio.json`.
2. Commit and push to `main`.
3. GitHub Pages reflects changes automatically.

### Main JSON Keys

- `profile`
- `news`
- `education`
- `publications`
- `conferenceProceedings`
- `honors`

### Optional Fields in Use

- `education[].major`: dual-major or major detail line
- `publications[].image`, `conferenceProceedings[].image`: card thumbnail image
- `publications[].award`, `conferenceProceedings[].award`: award label

## Notes

- Admin page has been removed. Content is maintained directly via `data/portfolio.json`.
- External links in hero section are icon buttons (CV, ORCID, Google Scholar, LinkedIn).
- Mobile layout is optimized for 390px-class screens.
