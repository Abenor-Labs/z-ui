import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The dev harness only exists so the components can be clicked. It has no
// build output anyone consumes — `pnpm build` runs it purely as a compile gate.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { outDir: 'dist' },
})
