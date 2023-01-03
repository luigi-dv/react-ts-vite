/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

//Vite Configuration Definitions
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom'
  },
  preview:{
    port:3000
  },
  server: {
    host: true,
    port:3000
  },
  resolve:{
    alias:{
      '@const': path.join(__dirname, './src/const'),
      '@components': path.join(__dirname, './src/components'),
      '@types': path.resolve(__dirname, './src/types'),
      '@services' : path.resolve(__dirname, './src/services'),
    },
  },

})
