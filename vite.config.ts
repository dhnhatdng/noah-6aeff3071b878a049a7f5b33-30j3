import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(async ({ mode }) => {
    const plugins = [react()];
    if (mode === "development") {
        // Lazy-loaded so `vite build` (production) never imports
        // ./plugins/component-tagger — and its @babel/parser dependency.
        const { default: componentTagger } = await import("./plugins/component-tagger");
        plugins.push(componentTagger());
    }
    return {
        // `base` is `/` by default (local dev, Vercel). The GitHub Pages
        // workflow sets VITE_BASE to the project subpath so built asset
        // URLs resolve under /noah-6aeff3071b878a049a7f5b33-30j3/.
        base: process.env.VITE_BASE ?? '/',
        server: {
            host: "0.0.0.0",
            port: 5173,
            allowedHosts: true,
            hmr: {
                overlay: false,
                timeout: 15000,
            },
            watch: {
                usePolling: true,
                interval: 500,
                binaryInterval: 500,
            },
        },
        plugins,
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src"),
            },
        },
    };
});
