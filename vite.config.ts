import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { firebaseConfigPlugin } from './plugins/firebaseConfigPlugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), firebaseConfigPlugin()],
})
