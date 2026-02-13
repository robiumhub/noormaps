import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { type Server } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function setupVite(app: Express, server: Server) {
    const { createServer: createViteServer } = await import("vite");
    const { default: viteConfig } = await import("../vite.config.js");

    const vite = await createViteServer({
        ...viteConfig,
        server: {
            middlewareMode: true,
            hmr: { server },
        },
        appType: "custom",
    });

    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
        const url = req.originalUrl;

        try {
            const clientIndexHtml = path.resolve(__dirname, "..", "client", "index.html");
            const template = fs.readFileSync(clientIndexHtml, "utf-8");
            const html = await vite.transformIndexHtml(url, template);
            res.status(200).set({ "Content-Type": "text/html" }).end(html);
        } catch (e) {
            vite.ssrFixStacktrace(e as Error);
            next(e);
        }
    });
}

export function serveStatic(app: Express) {
    const distPath = path.resolve(__dirname, "..", "public");

    if (!fs.existsSync(distPath)) {
        throw new Error(`Could not find build directory: ${distPath}. Run 'npm run build' first.`);
    }

    app.use(express.static(distPath));

    app.get("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
    });
}

export function log(message: string) {
    const time = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
    console.log(`[${time}] ${message}`);
}
