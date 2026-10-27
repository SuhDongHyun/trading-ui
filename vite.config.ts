import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_API_PROXY_TARGET = 'http://localhost:9999';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxy: Record<string, ProxyOptions> = {
    '/api': {
      target: env.API_PROXY_TARGET || DEFAULT_API_PROXY_TARGET,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  };

  return {
    plugins: [react()],
    server: {
      proxy: apiProxy,
    },
    preview: {
      proxy: apiProxy,
    },
  };
});
