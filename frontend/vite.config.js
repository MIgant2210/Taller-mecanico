import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic', // Transformación moderna
    }),
  ],

  
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
    },
    open: true,
  },

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser', // Mejor compresión para producción
  },

  // Seguridad mejorada
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    // Agrega otras variables manualmente si las necesitas:
    // 'process.env.API_URL': JSON.stringify('http://localhost:8000')
  },

  // Optimización adicional
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios'], // Pre-empaqueta estas dependencias
  },
});