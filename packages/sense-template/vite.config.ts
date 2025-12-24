import { defineConfig } from "vite";
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  esbuild: {
    jsxFactory: "Sense.createElement",
    jsxFragment: "Sense.Fragment",
  },
  plugins: [
      tailwindcss(),
    ],
});
