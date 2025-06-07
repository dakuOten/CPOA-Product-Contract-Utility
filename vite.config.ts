import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import babel from 'vite-plugin-babel'
import path from 'path'

// React Compiler configuration
const ReactCompilerConfig = {
  target: '19', // Target React 19
  sources: (filename: string) => {
    // Apply React Compiler to all files in src directory
    return filename.indexOf('src') !== -1;
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Apply React Compiler via Babel plugin
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ['@babel/preset-typescript'],
        plugins: [
          ['babel-plugin-react-compiler', ReactCompilerConfig]
        ]
      }
    }),
    react(), 
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['./src/utils/zohoApi.ts']
        }
      }
    }
  },
  base: './'
})
