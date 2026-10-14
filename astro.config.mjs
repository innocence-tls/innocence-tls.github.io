import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  site: 'https://innocence-tls.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  vite: {
    // Корень проекта для чтения файлов при сборке, не зависит от того, откуда запущен astro
    define: { __ROOT__: JSON.stringify(fileURLToPath(new URL('.', import.meta.url))) },
  },
});
