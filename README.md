# The Forgotten Dungeon

A self-contained HTML dungeon game, deployed automatically to GitHub Pages.

## Deploy

1. Push this repository's `main` branch to GitHub.
2. In **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**.
3. The **Deploy game to GitHub Pages** workflow will publish the game after each push to `main`. It can also be run manually from the repository's **Actions** tab.

The workflow publishes `Dungeon.io.html` as the site root (`index.html`), so the game is available at the GitHub Pages URL without renaming the source file.
