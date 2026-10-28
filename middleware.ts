import { rewrite } from '@vercel/functions/middleware';

// Vercel 배포에서 /api 요청을 API_PROXY_TARGET으로 프록시한다.
// 로컬 개발/preview 서버는 vite.config.ts의 proxy가 같은 역할을 한다.
export const config = {
  matcher: '/api/:path*',
};

export default function middleware(request: Request): Response {
  const target = process.env.API_PROXY_TARGET;

  if (!target) {
    return new Response('API_PROXY_TARGET is not configured.', { status: 500 });
  }

  return rewrite(toApiProxyUrl(request.url, target));
}

export function toApiProxyUrl(requestUrl: string, target: string): URL {
  const { pathname, search } = new URL(requestUrl);
  const path = pathname.replace(/^\/api/, '');

  return new URL(`${target.replace(/\/+$/, '')}${path}${search}`);
}
