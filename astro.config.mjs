import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://suyuu-yousa.github.io',
  base: '/blog',
  vite: {
    plugins: [tailwindcss()],
  },
});
