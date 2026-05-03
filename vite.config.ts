import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

// ─── SECURITY: Block direct browser access to source files ──
// Prevents users from navigating to /components/Header.tsx etc.
// Vite's HMR still works because internal requests use /@fs/, /@vite/, /@id/ prefixes.
function sourceFileGuard(): Plugin {
  // File extensions that should NEVER be served directly to browsers
  const BLOCKED_EXTENSIONS = /\.(tsx?|jsx?|vue|svelte|env|md|sql|json|lock|log|local)$/i;
  // Paths that are always blocked
  const BLOCKED_PATHS = /^\/(\.env|\.git|\.agent|\.brain|GEMINI|RULES|plans|scripts|supabase|api|docs)\b/i;
  // Vite internal requests that must be allowed through
  const VITE_INTERNAL = /^\/(@vite|@fs|@id|__vite|node_modules\/\.vite|src\/)/;
  // Static assets that should always be served
  const STATIC_ASSETS = /\.(css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|webp|mp4|webm|pdf)$/i;

  return {
    name: 'source-file-guard',
    configureServer(server) {
      // This middleware runs BEFORE Vite's transform pipeline
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        const pathname = url.split('?')[0]; // Strip query params

        // ✅ Always allow: root, Vite internals, API routes, static assets, HMR websocket
        if (
          pathname === '/' ||
          pathname === '/index.html' ||
          VITE_INTERNAL.test(pathname) ||
          pathname.startsWith('/api/') ||
          STATIC_ASSETS.test(pathname) ||
          pathname.startsWith('/@') ||
          pathname === '/__vite_ping'
        ) {
          return next();
        }

        // ✅ Allow: Vite's module requests (have ?import, ?v=, ?t= query params for HMR)
        if (url.includes('?import') || url.includes('?v=') || url.includes('?t=')) {
          return next();
        }

        // 🛡️ Block: Direct access to sensitive paths
        if (BLOCKED_PATHS.test(pathname)) {
          console.warn(`[SECURITY] Blocked access to sensitive path: ${pathname}`);
          res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>403 — Forbidden</h1><p>Truy cập bị từ chối.</p>');
          return;
        }

        // 🛡️ Block: Direct browser navigation to source files
        // Check Sec-Fetch-Dest header: 'document' = browser navigation, 'script' = module import
        const fetchDest = req.headers['sec-fetch-dest'];
        if (BLOCKED_EXTENSIONS.test(pathname) && fetchDest === 'document') {
          console.warn(`[SECURITY] Blocked direct navigation to source file: ${pathname}`);
          // Redirect to app root instead of showing source
          res.writeHead(302, { Location: '/' });
          res.end();
          return;
        }

        next();
      });
    },
  };
}

// ─── Local Dev Proxy for /api/gemini-extract ────────────────
// Khi chạy `npm run dev`, Vite không có serverless functions.
// Plugin này xử lý /api/gemini-extract locally bằng GEMINI_API_KEY từ env.
function geminiExtractProxy(env: Record<string, string>): Plugin {
  return {
    name: 'gemini-extract-proxy',
    configureServer(server) {
      server.middlewares.use('/api/gemini-extract', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' });
          res.end();
          return;
        }
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        // Read request body
        let body = '';
        for await (const chunk of req) body += chunk;
        let parsed: any;
        try { parsed = JSON.parse(body); } catch { res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid JSON' })); return; }

        const apiKey = env.GEMINI_API_KEY || env.VITE_GOOGLE_API_KEY;
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'GEMINI_API_KEY chưa được cấu hình. Thêm vào file .env.local' }));
          return;
        }

        const { parts, maxTokens = 8192, temperature = 0.1, model = 'gemini-2.0-flash' } = parsed;

        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: { temperature, maxOutputTokens: maxTokens },
              }),
            }
          );

          if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            res.writeHead(geminiRes.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Gemini API: ${geminiRes.status} - ${errText.substring(0, 200)}` }));
            return;
          }

          const json = await geminiRes.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ text }));
        } catch (e: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message || 'Internal Server Error' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0', // Mở cho LAN nội bộ (văn phòng) — thay đổi từ 'localhost'
      proxy: {
        // Gemma vLLM — target từ env (máy chủ công ty) hoặc fallback localhost dev
        '/api/vllm_gemma': {
          target: env.VITE_VLLM_GEMMA_URL || 'http://localhost:8002',
          changeOrigin: true,
          secure: false,  // Cho phép self-signed cert trên máy chủ nội bộ
          rewrite: (path) => path.replace(/^\/api\/vllm_gemma/, '/v1')
        },
        // LiteLLM / vLLM chung — target từ env hoặc fallback localhost dev
        '/api/vllm': {
          target: (env.VITE_VLLM_URL || 'http://localhost:4000') + '/v1',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/vllm/, '')
        },

      },
      watch: {
        ignored: ['**/scripts/auto-train/venv/**'],
      },
      fs: {
        // SECURITY: Block access to sensitive files even via Vite's file server
        deny: [
          '.env',
          '.env.local',
          '.env.*',
          '.git/**',
          '.agent/**',
          '.brain/**',
          'GEMINI.md',
          'RULES.md',
          'PhanQuyenHeThong.md',
          'plans/**',
          'supabase/**',
          'scripts/**',
          'docs/**',
        ],
      },
    },
    plugins: [
      sourceFileGuard(), // MUST be first — blocks requests before Vite processes them
      react(),
      geminiExtractProxy(env),
    ],
    // SECURITY: API Key Gemini chạy qua Vercel Serverless Function (/api/gemini-extract).
    // Local dev dùng Vite plugin proxy ở trên → key không bao giờ lộ ra client bundle.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    // ─── Strip console.* and debugger from production bundle ────
    // esbuild handles this at parse time — zero runtime overhead.
    // Keeps console.warn/error in dev (mode !== 'production').
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // ─── Core framework ────────────────────────────────────────
            'react-vendor': ['react', 'react-dom', 'react-router-dom', 'react-is'],
            'tanstack': ['@tanstack/react-query'],
            // ─── Backend SDK ────────────────────────────────────────────
            'supabase': ['@supabase/supabase-js'],
            // ─── AI providers ───────────────────────────────────────────
            'ai-vendor': ['@google/generative-ai', 'openai'],
            // ─── UI utilities ───────────────────────────────────────────
            'ui-vendor': ['lucide-react', 'framer-motion', 'sonner'],
            // ─── Drag-and-drop (used only in a few places) ──────────────
            'dnd': ['@dnd-kit/core', '@dnd-kit/utilities'],
            // ─── Rich text editor (heavy — only used in contract/task forms) ─
            // Note: @tiptap/pm is omitted — it only exposes subpath exports
            // (@tiptap/pm/state etc.) and cannot be chunked by bare specifier.
            'tiptap': [
              '@tiptap/react',
              '@tiptap/starter-kit',
              '@tiptap/extension-image',
            ],
            // ─── Charts (only used on Analytics/Dashboard pages) ────────
            'recharts': ['recharts'],
            // ─── Spreadsheet (only used on import/export) ───────────────
            'xlsx': ['xlsx'],
            // ─── PDF generation & parsing (export/viewer) ────────────────
            'pdf': ['jspdf', 'jspdf-autotable', 'pdfjs-dist'],
            // ─── Document export (DOCX generation) ───────────────────────
            'docx-export': ['docx', 'mammoth'],
            // ─── Markdown rendering ─────────────────────────────────────
            'markdown': ['marked', 'react-markdown', 'remark-gfm'],
            // ─── Date utilities ─────────────────────────────────────────
            'date': ['date-fns'],
          }
        },
        plugins: [
          // Bundle visualizer — outputs to docs/perf/bundle-stats.html
          // View after build: open docs/perf/bundle-stats.html
          visualizer({
            filename: 'docs/perf/bundle-stats.html',
            open: false,
            gzipSize: true,
            brotliSize: true,
            template: 'treemap',
          }) as any,
        ],
      }
    }
  };
});
