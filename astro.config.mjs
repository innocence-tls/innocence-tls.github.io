import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

// Старые адреса релизов (до переименования папок) -> новые, чтобы разосланные ссылки не ломались
const moved = JSON.parse(fs.readFileSync(new URL('./src/data/redirects.json', import.meta.url), 'utf8'));

export default defineConfig({
  site: 'https://innocence-tls.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  redirects: Object.fromEntries(Object.entries(moved).map(([from, to]) => [`/r/${from}/`, `/r/${to}/`])),
  vite: {
    // Корень проекта для чтения файлов при сборке, не зависит от того, откуда запущен astro
    define: { __ROOT__: JSON.stringify(fileURLToPath(new URL('.', import.meta.url))) },
  },
});
