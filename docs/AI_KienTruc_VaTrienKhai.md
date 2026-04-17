# Kiến trúc AI & Triển khai Cloud

> Tài liệu mô tả cơ chế AI hiện tại của CIC-ERP và cách user ở nhiều máy khác nhau kết nối được AI nội bộ qua domain Mắt Bão.

---

## 1. Tổng quan kiến trúc hiện tại

### 1.1 Các AI Provider được hỗ trợ

| Provider | Model mặc định | Vai trò | Trạng thái |
|----------|---------------|---------|------------|
| **Local vLLM** | Gemma 4 26B, Qwen 2.5 7B | Xử lý chính — miễn phí, bảo mật | Chạy trên máy chủ CIC, expose qua Mắt Bão |
| **Google Gemini** | Gemini 2.0 Flash | Fallback #1, extract tài liệu | Cloud — cần API key |
| **OpenAI** | GPT-4o | Fallback #2 | Cloud — cần API key |
| **DeepSeek** | DeepSeek Chat V3 | Fallback #3 | Cloud — cần API key |

### 1.2 Cổng AI duy nhất (Gateway)

Tất cả AI calls đều đi qua một file: `services/ai/gateway.ts`

```
[Component/Agent] → gateway.streamChat() → [Provider] → [LLM]
```

Gateway xử lý: chọn provider, fallback tự động, logging, cost tracking, rate limiting.

### 1.3 Hệ thống Multi-Agent (OpenClaw)

```
User gõ câu hỏi
    ↓
AIAssistant.tsx (UI)
    ↓
openclaw/router.ts → phân quyền RBAC → chọn Agent
    ↓
openclaw/react-loop.ts → ReAct loop (Reason → Act → Observe)
    ↓
openclaw/tools/registry.ts → 29+ ERP tools (tra hợp đồng, KPI, doanh thu...)
    ↓
gateway.ts → gọi LLM
```

**Agents hiện có:**
- **Ban Giám Đốc (BGD)**: 27 tools, model Gemma 4 26B, scope toàn công ty
- **Marketing (MKT)**: social posting, SEO, newsletter

---

## 2. Cơ chế kết nối Local AI — Thực trạng

### 2.1 Sơ đồ luồng — Phương án đã triển khai (IP tĩnh + Domain Mắt Bão)

```
┌──────────────────────────────────────────┐
│  Trình duyệt (user bất kỳ — Vercel app)  │
│  POST https://ai-api.cic.com.vn/v1/...   │  ← gọi thẳng domain Mắt Bão
└──────────────────┬───────────────────────┘
                   │ HTTPS (port 443)
                   ▼
┌──────────────────────────────────────────┐
│  Nginx trên máy chủ CIC                  │
│  IP tĩnh: 118.70.182.173                 │
│  Domain: ai-api.cic.com.vn (Mắt Bão)    │
│  SSL: Let's Encrypt hoặc Mắt Bão cert    │
│  → proxy_pass http://localhost:4000/v1   │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│  LiteLLM Router (port 4000)              │
│  Route theo model name:                  │
│  - gemma-4-26b  → localhost:8001         │
│  - qwen-2.5-7b  → localhost:8000         │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│  vLLM Instances (trên máy chủ CIC)       │
│  :8000 Qwen 2.5 VL 7B                    │
│  :8001 Gemma 4 26B                        │
└──────────────────────────────────────────┘
```

**Môi trường Dev (localhost):**
```
Browser → Vite Proxy (/api/vllm) → localhost:4000 → vLLM
```
Dùng Vite proxy khi không set URL trong Personal Settings.

### 2.2 Cách Gateway resolve URL (sau khi fix)

`services/ai/gateway.ts` hàm `getLocalAIBaseURL()` xử lý theo thứ tự ưu tiên:

```typescript
// 1. Nếu localStorage có proxy path (/api/vllm) → dùng Vite proxy (dev)
if (stored.startsWith('/api/')) return isGemma ? '/api/vllm_gemma' : '/api/vllm';

// 2. Nếu localStorage có URL tường minh (domain Mắt Bão / IP tĩnh) → gọi thẳng
//    Điều kiện: URL phải nằm trong whitelist an toàn
const isAllowed = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.|ai-api\.cic\.com\.vn|118\.70\.182\.173)/.test(stored);
if (isAllowed) return stored;  // → "https://ai-api.cic.com.vn"

// 3. Mặc định: /api/vllm (Vite proxy cho dev)
```

**Điều kiện để gọi thẳng domain Mắt Bão hoạt động:**
- Server phải trả về CORS header: `Access-Control-Allow-Origin: *` (hoặc domain Vercel cụ thể)
- User phải set URL trong **Personal Settings → Máy chủ AI Nội bộ**

### 2.3 Cấu hình Proxy (vite.config.ts:143-157)

```typescript
'/api/vllm': {
  target: (env.VITE_VLLM_URL || 'http://localhost:4000') + '/v1',
  changeOrigin: true,
  secure: false,       // Cho phép self-signed cert nội bộ
  rewrite: (path) => path.replace(/^\/api\/vllm/, '')
},
'/api/vllm_gemma': {
  target: env.VITE_VLLM_GEMMA_URL || 'http://localhost:8002',
  changeOrigin: true,
  secure: false,
  rewrite: (path) => path.replace(/^\/api\/vllm_gemma/, '/v1')
},
```

Biến môi trường `.env.local`:
```
VITE_VLLM_URL=http://localhost:4000        # hoặc IP máy chủ vLLM
VITE_VLLM_GEMMA_URL=http://localhost:8002  # hoặc IP máy chủ Gemma
```

### 2.4 Fallback tự động khi Local AI lỗi

```
Local (Gemma) gọi thất bại (ECONNREFUSED / timeout)
    ↓
Hiện thông báo: "Chuyển sang Gemini Flash do lỗi kết nối gemma-4-26b"
    ↓
Thử Gemini Flash (cloud)
    ↓ (nếu Gemini cũng lỗi)
Thử OpenAI → DeepSeek → Báo lỗi user
```

Không cần thao tác thủ công — hoàn toàn tự động.

### 2.5 Ngrok header trong code

```typescript
// gateway.ts:779
if (isVllm) headers['ngrok-skip-browser-warning'] = 'true';
```

Cho thấy vLLM **đã được test với ngrok tunnel** — đây là gợi ý cho giải pháp cloud.

---

## 3. Phương án đã triển khai: IP tĩnh + Domain Mắt Bão

### 3.1 Kiến trúc

CIC đã đăng ký domain qua Mắt Bão và trỏ về IP tĩnh của máy chủ nội bộ. Nginx trên máy chủ đó làm reverse proxy đến LiteLLM.

| Thành phần | Giá trị |
|-----------|--------|
| IP tĩnh | `118.70.182.173` |
| Domain | `ai-api.cic.com.vn` (Mắt Bão) |
| Port public | 443 (HTTPS) |
| LiteLLM | `localhost:4000` (nội bộ máy chủ) |
| API Key | `sk-cic-2026` |

### 3.2 Cách user kết nối

User vào **Personal Settings → Máy chủ AI Nội bộ** và điền:

```
Base URL: https://ai-api.cic.com.vn
Model:    gemma-4-26b
☑ Luôn ưu tiên dùng Máy chủ AI Nội bộ
```

Sau khi lưu, app gọi thẳng `https://ai-api.cic.com.vn/v1/chat/completions` từ browser — không qua Vercel.

### 3.3 Yêu cầu Nginx phải có CORS headers

**Đây là điều kiện bắt buộc** để browser (trên app Vercel) gọi được domain Mắt Bão:

```nginx
location /v1/ {
    # CORS — cho phép app Vercel gọi vào
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

    if ($request_method = 'OPTIONS') {
        return 204;
    }

    # Auth
    if ($http_authorization != "Bearer sk-cic-2026") {
        return 403;
    }

    proxy_pass http://localhost:4000/v1/;
    proxy_set_header Host $host;
    # Streaming support
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding on;
}
```

### 3.4 Bug đã phát hiện và fix (2026-04-17)

`gateway.ts` trước đây có bug: **luôn trả về `/api/vllm`** kể cả khi localStorage có URL Mắt Bão, khiến domain Mắt Bão bị bỏ qua hoàn toàn.

**Sau khi fix:** nếu localStorage chứa URL hợp lệ (`https://ai-api.cic.com.vn`), gateway trả về đúng URL đó để browser gọi thẳng.

---

## 4. Vấn đề khi deploy lên Cloud (Vercel) — trước khi có Mắt Bão

### 3.1 Tại sao Local AI không hoạt động trên Vercel?

Khi app deploy lên Vercel:
- Vite proxy **không tồn tại** (chỉ có trong dev server)
- Vercel serverless function chạy trên data center AWS — không thể kết nối `localhost:4000` của máy dev
- Request `/api/vllm/...` → **404 Not Found** → tự fallback sang Gemini

```
Browser (user ở máy khác)
    ↓ POST /api/vllm/chat/...
Vercel Edge Network
    ↓ Không có handler → 404
Gateway nhận lỗi → fallback Gemini ✓ (nhưng tốn tiền, không dùng local)
```

### 3.2 Hiện trạng Backend AI

| Function | Platform | Provider | Ghi chú |
|----------|----------|----------|---------|
| `supabase/functions/ai-proxy` | Supabase Edge | OpenAI, DeepSeek | **Không có local AI** |
| `supabase/functions/gemini-proxy` | Supabase Edge | Gemini | **Không có local AI** |
| `api/gemini-extract.ts` | Vercel Serverless | Gemini | Có quota tracking |

**Không có bridge nào từ cloud đến local vLLM hiện tại.**

---

## 4. Đề xuất: Các phương án triển khai cho Cloud Users

### Phương án A — Nginx Reverse Proxy trên máy chủ CIC ⭐ Khuyến nghị

**Ý tưởng:** Máy chủ vLLM (nội bộ CIC) expose API ra ngoài qua Nginx + HTTPS, Vercel gọi vào đó.

```
Browser (user bất kỳ)
    ↓ POST /api/vllm/chat/...
Vercel Edge Function /api/vllm.ts (NEW)
    ↓ Forward request
Nginx trên máy chủ CIC (118.70.182.173:443)
    ↓ Proxy_pass nội bộ
vLLM LiteLLM (localhost:4000)
    ↓
Gemma 4 26B / Qwen
```

**Cần làm:**

**Bước 1:** Cấu hình Nginx trên máy chủ CIC
```nginx
# /etc/nginx/sites-available/ai-api.cic.com.vn
server {
    listen 443 ssl;
    server_name ai-api.cic.com.vn;

    ssl_certificate     /etc/letsencrypt/live/ai-api.cic.com.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ai-api.cic.com.vn/privkey.pem;

    # Xác thực bằng API key (tránh public access)
    location /v1/ {
        if ($http_authorization != "Bearer sk-cic-2026") {
            return 403;
        }
        proxy_pass http://localhost:4000/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # Quan trọng: streaming support
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
    }
}
```

**Bước 2:** Tạo Vercel serverless function làm bridge
```typescript
// api/vllm.ts (NEW FILE)
import type { VercelRequest, VercelResponse } from '@vercel/node';

const LOCAL_AI_URL = process.env.LOCAL_AI_BASE_URL; // https://ai-api.cic.com.vn

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!LOCAL_AI_URL) {
    return res.status(503).json({ error: 'Local AI not configured' });
  }

  const targetPath = req.url?.replace('/api/vllm', '/v1') || '/v1/chat/completions';
  const targetUrl = `${LOCAL_AI_URL}${targetPath}`;

  const response = await fetch(targetUrl, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LOCAL_AI_API_KEY || 'sk-cic-2026'}`,
    },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
  });

  // Stream response
  res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
  const reader = response.body?.getReader();
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  }
}
```

**Bước 3:** Thêm env vars vào Vercel Dashboard
```
LOCAL_AI_BASE_URL=https://ai-api.cic.com.vn
LOCAL_AI_API_KEY=sk-cic-2026
```

**Ưu điểm:** An toàn (HTTPS + auth), không cần tool bên thứ 3, streaming hoạt động tốt  
**Nhược điểm:** Cần quyền cấu hình DNS + Nginx trên máy chủ CIC, cần port 443 mở ra ngoài

---

### Phương án B — Cloudflare Tunnel (Zero Trust)

**Ý tưởng:** Cloudflare Tunnel tạo kết nối outbound từ máy chủ vLLM ra Cloudflare, không cần mở port firewall.

```
Browser (user bất kỳ)
    ↓
Vercel → gọi https://ai-cic.yoursubdomain.trycloudflare.com
    ↓
Cloudflare Network
    ↓ (tunnel đã kết nối)
cloudflared daemon (chạy trên máy vLLM)
    ↓
localhost:4000 (vLLM)
```

**Cài đặt trên máy chủ vLLM:**
```bash
# Cài cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared

# Tạo tunnel (cần Cloudflare account + domain)
cloudflared tunnel create cic-ai
cloudflared tunnel route dns cic-ai ai-api.cic.com.vn

# Chạy tunnel
cloudflared tunnel --url http://localhost:4000 run cic-ai
```

**Ưu điểm:** Không cần mở port firewall, HTTPS tự động, Cloudflare Zero Trust access control  
**Nhược điểm:** Phụ thuộc dịch vụ bên thứ 3 (Cloudflare), cần domain trong Cloudflare, có thể ảnh hưởng latency

---

### Phương án C — Supabase Edge Function Bridge

**Ý tưởng:** Tạo Supabase Edge Function làm trung gian, user đã authenticated với Supabase thì được forward đến local AI.

```
Browser (user đã login)
    ↓ POST /functions/v1/local-ai-proxy
Supabase Edge Function
    ↓ Kiểm tra JWT → forward đến vLLM URL
vLLM (qua ngrok hoặc Nginx)
```

```typescript
// supabase/functions/local-ai-proxy/index.ts (NEW)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Xác thực user qua JWT
  const authHeader = req.headers.get('Authorization')
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)
  const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', '') || '')
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Forward đến local AI
  const localAIUrl = Deno.env.get('LOCAL_AI_BASE_URL') // https://ai-api.cic.com.vn
  const body = await req.text()
  const response = await fetch(`${localAIUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer sk-cic-2026` },
    body,
  })

  return new Response(response.body, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
})
```

**Ưu điểm:** Kế thừa auth của Supabase, không cần thêm infrastructure Vercel  
**Nhược điểm:** Supabase Edge Functions có timeout 150s — phù hợp nhưng cần test với streaming

---

### Phương án D — Chỉ dùng Cloud AI (không local)

**Ý tưởng:** Bỏ local AI cho production, dùng Gemini/OpenAI/DeepSeek. Local AI chỉ dùng khi dev.

```
Production: Gemini 2.0 Flash (primary) → OpenAI → DeepSeek
Dev local:  Gemma 4 26B (primary) → Gemini (fallback)
```

Cấu hình qua biến môi trường:
```
# .env.production
VITE_DEFAULT_PROVIDER=gemini    # Ép dùng cloud trên production
VITE_DISABLE_LOCAL_AI=true
```

**Ưu điểm:** Đơn giản nhất, không cần infrastructure, mọi user đều dùng được ngay  
**Nhược điểm:** Tốn chi phí API, phụ thuộc internet, dữ liệu công ty đi qua cloud bên thứ 3

---

## 5. So sánh và Khuyến nghị

| Tiêu chí | Phương án A (Nginx) | Phương án B (Cloudflare) | Phương án C (Supabase) | Phương án D (Cloud only) |
|----------|---------------------|--------------------------|------------------------|--------------------------|
| **Độ phức tạp setup** | Trung bình | Thấp | Thấp | Rất thấp |
| **Chi phí** | Miễn phí | Miễn phí (Free tier) | Miễn phí | ~$20-100/tháng API |
| **Bảo mật dữ liệu** | ✅ Nội bộ | ⚠️ Qua Cloudflare | ✅ JWT auth | ❌ Ra cloud bên thứ 3 |
| **Tốc độ** | Nhanh nhất | Tốt | Tốt | Phụ thuộc quota |
| **Streaming** | ✅ Full | ✅ Full | ⚠️ Cần test | ✅ Full |
| **Không cần mở port** | ❌ Cần port 443 | ✅ Không cần | ✅ Không cần | ✅ Không cần |
| **Phụ thuộc bên thứ 3** | Không | Cloudflare | Supabase (đã có) | Gemini/OpenAI |

### Khuyến nghị theo giai đoạn:

**Giai đoạn 1 — Triển khai nhanh (1-2 ngày):**
→ **Phương án D** (Cloud only): Chuyển default sang Gemini Flash cho môi trường production. User dùng được ngay, không cần cấu hình hạ tầng.

**Giai đoạn 2 — Tích hợp Local AI an toàn (1-2 tuần):**
→ **Phương án A** (Nginx) nếu có quyền admin máy chủ CIC, hoặc **Phương án B** (Cloudflare Tunnel) nếu muốn đơn giản hơn.

**Giai đoạn 3 — Kiểm soát truy cập chặt chẽ:**
→ Kết hợp Phương án A + C: Nginx expose AI, Supabase Edge Function kiểm tra quyền user trước khi forward.

---

## 6. Kế hoạch thực hiện Phương án A (chi tiết)

### Checklist

- [ ] **Máy chủ CIC:** Cài certbot, tạo SSL cho `ai-api.cic.com.vn`
- [ ] **Máy chủ CIC:** Cấu hình Nginx reverse proxy (xem mẫu mục 4.A)
- [ ] **DNS:** Trỏ `ai-api.cic.com.vn` → `118.70.182.173`
- [ ] **Firewall:** Mở port 443 inbound
- [ ] **Code:** Tạo `api/vllm.ts` (Vercel serverless bridge — xem mẫu mục 4.A)
- [ ] **Vercel:** Thêm `LOCAL_AI_BASE_URL` và `LOCAL_AI_API_KEY` vào Environment Variables
- [ ] **Code:** Cập nhật `vite.config.ts` — Vite proxy vẫn giữ cho dev local
- [ ] **Test:** Verify streaming chat từ máy khác qua cloud URL

### Biến môi trường cần thêm

```bash
# Vercel Dashboard → Settings → Environment Variables
LOCAL_AI_BASE_URL=https://ai-api.cic.com.vn
LOCAL_AI_API_KEY=sk-cic-2026

# .env.local (dev — giữ nguyên)
VITE_VLLM_URL=http://localhost:4000
VITE_VLLM_GEMMA_URL=http://localhost:8002
```

---

## 7. Cấu hình LiteLLM hiện tại (tham khảo)

File: `scripts/ai/litellm/config.yaml`

```yaml
model_list:
  - model_name: gemma-4-26b
    litellm_params:
      model: openai/gemma-4-26b
      api_base: http://localhost:8001/v1
      api_key: none

  - model_name: qwen-2.5-7b
    litellm_params:
      model: openai/qwen2.5-7b-instruct
      api_base: http://localhost:8000/v1
      api_key: none

general_settings:
  master_key: sk-cic-2026
  database_url: null
```

---

## 8. Ghi chú bảo mật

1. **API Key `sk-cic-2026`** — Đây là LiteLLM master key nội bộ. Khi expose ra ngoài qua Nginx, **bắt buộc** thêm xác thực tầng Nginx (như mẫu trên). Cân nhắc đổi key định kỳ.

2. **Dữ liệu hợp đồng** — Khi dùng cloud AI (Phương án D), nội dung hợp đồng/doanh thu gửi lên Gemini/OpenAI API. Cần xem xét chính sách bảo mật dữ liệu theo quy định nội bộ CIC.

3. **LocalStorage override** — User có thể override AI endpoint qua localStorage. Không ảnh hưởng bảo mật vì gateway luôn route qua `/api/vllm` proxy, không gọi thẳng IP.

4. **Rate limiting** — Bảng `ai_permissions` trong Supabase kiểm soát quota per user. Khi mở rộng cho nhiều user, cần review quota phù hợp.

---

*Tài liệu tạo ngày 2026-04-17. Cập nhật khi thay đổi infrastructure.*
