import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { VitePWA } from "vite-plugin-pwa";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "", "");
  const backendUrl =
    env.VITE_BACKEND_URL || "https://gsi-traccar-traccar.bwlm85.easypanel.host";

  return {
    server: {
      port: 3000,
      proxy: {
        "/api/socket": {
          target: backendUrl,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: "build",
    },
    plugins: [
      {
        name: "html-template-vars",
        transformIndexHtml(html) {
          return html
            .replace(/\$\{title\}/g, "GSI Tracking")
            .replace(/\$\{description\}/g, "GSI GPS Tracking System")
            .replace(/\$\{colorPrimary\}/g, "#1976d2");
        },
      },
      svgr(),
      react(),
      VitePWA({
        includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png"],
        workbox: {
          navigateFallbackDenylist: [/^\/api/],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          globPatterns: ["**/*.{js,css,html,woff,woff2,mp3}"],
        },
        manifest: {
          short_name: "GSI Tracking",
          name: "GSI GPS Tracking System",
          theme_color: "#1976d2",
          icons: [
            {
              src: "pwa-64x64.png",
              sizes: "64x64",
              type: "image/png",
            },
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
      }),
      viteStaticCopy({
        targets: [
          {
            src: "node_modules/@mapbox/mapbox-gl-rtl-text/dist/mapbox-gl-rtl-text.js",
            dest: "",
          },
          {
            src: "src/resources/sounds/*.mp3",
            dest: "resources/sounds",
          },
          {
            src: "src/resources/alarm.mp3",
            dest: "resources",
          },
        ],
      }),
    ],
  };
});
