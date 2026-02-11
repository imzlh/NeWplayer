import axios, { AxiosInstance, AxiosResponse } from 'axios'
import type { ApiResponse } from '@/api/types'

// @ts-ignore
const BASE_URL = import.meta.env.NEWP_API_BASE_URL || '/@neast';
// @ts-ignore
const KV_URL = import.meta.env.NEWP_KV_API_URL || '/cgi-bin/kv';
// @ts-ignore
const COOKIE_URL = import.meta.env.NEWP_COOKIE_API_URL || '/cgi-bin/cookie';
// @ts-ignore
const KV_ENABLED = !!import.meta.env.NEWP_DISABLE_KV;

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加时间戳防止缓存
    if (config.params?.nocache) {
      config.params.nocache = undefined;  // remove nocache param
      config.params.timestamp = Date.now()
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    let res = response.data;
    if (Object.keys(res).length == 1 && res.data)
      res = res.data;
    if (res.code !== 200 && res.code !== 800) {
      console.error('API Error:', res.message || 'Unknown error')
    }
    return response
  },
  (error) => {
    console.error('Request Error:', error.message || error)
    return Promise.reject(error)
  }
)

// 封装GET请求
export const get = <T = any>(url: string, params?: any): Promise<T> => {
  return request.get(url, { params }).then((res) => res.data)
}

// 封装POST请求
export const post = <T = any>(url: string, data?: any): Promise<T> => {
  return request.post(url, data).then((res) => res.data)
}

export default request
export namespace KV {
  export class Error extends globalThis.Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly key?: string
    ) {
      super(message);
    }
  }

  const TIMEOUT = 10000;

  async function req(
    method: string,
    key?: string,
    body?: string,
    query?: Record<string, string>
  ): Promise<Response> {
    if (!KV_ENABLED) throw new Error("KV remote store disabled", 404);

    const params = new URLSearchParams();
    if (key) params.set('key', key);
    if (query) Object.entries(query).forEach(([k, v]) => params.set(k, v));

    const url = `${KV_URL}?${params.toString()}`;
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), TIMEOUT);

    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'text/plain' } : {},
        body,
        signal: ctrl.signal
      });
      return res;
    } finally {
      clearTimeout(id);
    }
  }

  /** GET ?key=xxx - 返回原始值或 null (404) */
  export async function get(key: string): Promise<string | null> {
    const res = await req('GET', key);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(await res.text(), res.status, key);
    return res.text();
  }

  /** PUT ?key=xxx - body 为值，成功返回 true */
  export async function put(key: string, value: string | Blob | ArrayBuffer): Promise<void> {
    const body = typeof value === 'string' ? value : await new Response(value).text();
    const res = await req('PUT', key, body);
    if (!res.ok) throw new Error(await res.text(), res.status, key);
    // 成功返回 204，无内容
  }

  function buildURL(key?: string, query?: Record<string, string>): string {
    const params = new URLSearchParams();
    if (key) params.set('key', key);
    if (query) Object.entries(query).forEach(([k, v]) => params.set(k, v));
    const qs = params.toString();
    return qs ? `${KV_URL}?${qs}` : KV_URL;
  }

  export function putUnload(key: string, value: string): boolean {
    if (!KV_ENABLED) return false;
    const url = buildURL(key);
    const blob = new Blob([value], { type: 'text/plain' });

    // 1. Beacon API (最优：系统级保证发送，不阻塞，64KB限制)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        if (navigator.sendBeacon(url, blob)) return true;
      } catch {
        // 失败则降级
      }
    }

    // 2. Fetch keepalive (次选：可能需要浏览器支持，不阻塞)
    if (typeof fetch !== 'undefined') {
      try {
        fetch(url, {
          method: 'POST', // PHP 已支持 POST = PUT
          keepalive: true,
          headers: { 'Content-Type': 'text/plain' },
          body: value
        }).catch(() => { }); // fire and forget
        return true;
      } catch {
        // 失败则降级
      }
    }

    // 3. Sync XHR (兜底：阻塞式，确保发送完成)
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, false); // false = 同步
      xhr.setRequestHeader('Content-Type', 'text/plain');
      xhr.send(value);
      return xhr.status === 204 || xhr.status === 200;
    } catch {
      return false;
    }
  }

  /** DELETE ?key=xxx - 成功返回 void，不存在抛 404 */
  export async function del(key: string): Promise<void> {
    const res = await req('DELETE', key);
    if (res.status === 404) throw new Error('Not found', 404, key);
    if (!res.ok) throw new Error(await res.text(), res.status, key);
  }

  /** LIST ?list=1&prefix=xxx - 返回 key 数组 */
  export async function list(prefix = ''): Promise<string[]> {
    const res = await req(
      'GET',
      undefined,
      undefined,
      { list: '1', prefix }
    );
    const text = await res.text();
    return text.trim() ? text.trim().split('\n') : [];
  }

  /** FIND ?find=query - 返回 {k,v} 数组 */
  export async function find(query: string): Promise<{ key: string, value: string }[]> {
    const res = await req(
      'GET', undefined, undefined,
      { find: query }
    );
    const items: { key: string, value: string }[] = [];
    const text = await res.text();
    if (!text.trim()) return items;

    for (const line of text.trim().split('\n')) {
      const tab = line.indexOf('\t');
      if (tab === -1) continue;
      items.push({
        key: line.slice(0, tab),
        value: line.slice(tab + 1)
      });
    }
    return items;
  }

  // 别名
  export const set = put;
  export const remove = del;
}

export namespace Cookie {
  export class Error extends globalThis.Error {
    constructor(message: string, public readonly status: number) {
      super(message);
    }
  }

  /**
   * POST - 设置浏览器 Cookie（支持用 ;; 分隔的多条）
   * 解决 JS 无法直接设置 HttpOnly / Secure / SameSite=None 等问题
   */
  export async function set(cookieString: string): Promise<void> {
    const res = await fetch(COOKIE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: cookieString
    });
    if (!res.ok) throw new Error(await res.text(), res.status);
  }

  /**
   * DELETE - 删除指定 Cookie（通过 name）
   */
  export async function del(name: string): Promise<void> {
    const res = await fetch(`${COOKIE_URL}?name=${encodeURIComponent(name)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(await res.text(), res.status);
  }

  export const remove = del;
}