import { defineConfig } from "wxt";

export default defineConfig({
    modules: ["@wxt-dev/module-react"],
    outDir: "dist",
    srcDir: ".",
    manifest: {
        name: "JobOracle",
        description: "AI-powered job application assistant",
        permissions: ["storage", "activeTab"],
        action: {},
        web_accessible_resources: [
            {
                resources: ["settings.html", "chunks/*", "assets/*"],
                matches: ["<all_urls>"],
            },
        ],
    },
    dev: {
        server: {
            port: 3001,
        },
    },
});
