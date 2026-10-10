
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules\/(react|react-dom)\//,
            },
            {
              name: 'supabase-vendor',
              test: /node_modules\/@supabase\/supabase-js\//,
            },
          ],
        },
      },
    },
  },
})
