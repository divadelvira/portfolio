import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import metadata from './src/content/metadata.json';
import {renderCmsMetadata} from './lib/cmsMetadata';
import {defineConfig, loadEnv, type PreviewServer, type ViteDevServer} from 'vite';

// Vite's SPA fallback otherwise serves the portfolio instead of the standalone CMS.
function serveAdmin(server: ViteDevServer | PreviewServer) {
  server.middlewares.use((req, _res, next) => {
    if (/^\/admin\/?(?:\?|$)/.test(req.url ?? '')) req.url = '/admin/index.html';
    next();
  });
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), {
      name: 'cms-metadata',
      transformIndexHtml: {
        order: 'pre',
        handler: html => renderCmsMetadata(html, metadata),
      },
    }, {
      name: 'decap-admin-route',
      configureServer: serveAdmin,
      configurePreviewServer: serveAdmin,
    }],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
