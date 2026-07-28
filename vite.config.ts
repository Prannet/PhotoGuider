import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages project sites are served from https://<user>.github.io/<repo>/,
// not the domain root, so the base path must include the repo name when building
// in that CI environment. GITHUB_REPOSITORY (set automatically by GitHub Actions)
// is "<owner>/<repo>"; locally (npm run dev / npm run build) it's unset and the
// app continues to serve from "/" as before.
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = repoName ? `/${repoName}/` : '/';

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Auction Photo Capture',
        short_name: 'AuctionPhotos',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1a1a1a',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
