import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const appVersion =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.APP_VERSION ??
  Date.now().toString();

function emitVersionJson(): PluginOption {
  return {
    name: 'emit-version-json',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version: appVersion }),
      });
    },
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [react(), emitVersionJson()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api/admin': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
    },
  },
});
