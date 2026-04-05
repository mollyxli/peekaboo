const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')
const { resolve } = require('path')

module.exports = defineConfig({
  plugins: [react.default()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        widget: resolve(__dirname, 'widget.html'),
        overlay: resolve(__dirname, 'overlay.html'),
        settings: resolve(__dirname, 'settings.html'),
      },
    },
  },
})
