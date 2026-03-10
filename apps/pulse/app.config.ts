import { defineConfig, type SolidStartInlineConfig } from '@solidjs/start/config';
import tailwindcss from '@tailwindcss/vite';

export const config = {
  ssr: false,
  vite: {
    plugins: [tailwindcss()],
  },
} satisfies SolidStartInlineConfig;

export default defineConfig(config);
