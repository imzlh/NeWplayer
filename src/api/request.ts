import axios, { AxiosInstance, AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types'

// @ts-ignore
const BASE_URL = import.meta.env.VITE_NEWP_API_BASE_URL || '/@neast';
// @ts-ignore
const KV_URL = import.meta.env.VITE_NEWP_KV_API_URL || '/cgi-bin/kv.php';

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
  export interface ListResult {
    keys: string[];
    n: number;
  }

  export interface FindItem {
    k: string;
    v: string;
  }

  export interface FindResult {
    find: string;
    items: FindItem[];
    n: number;
  }

  export class Error extends globalThis.Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly key?: string
    ) {
      super(message);
    }
  }

  async function req(
    method: string,
    key: string,
    body?: string,
    signal?: AbortSignal
  ): Promise<Response> {
    const url = `${KV_URL.replace(/\/$/, '')}?prefix=${encodeURIComponent(key).replace(/%2F/g, '/')}`;
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 3000);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Accept': 'application/json, text/plain',
          ...(body ? { 'Content-Type': 'text/plain' } : {})
        },
        body,
        signal: signal || ctrl.signal
      });
      return res;
    } finally {
      clearTimeout(id);
    }
  }

  export async function get(key: string): Promise<string | null> {
    const res = await req('GET', `${key}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(await res.text(), res.status, key);
    return res.text();
  }

  export async function put(key: string, value: string | Blob | ArrayBuffer): Promise<boolean> {
    const body = typeof value === 'string' ? value : await new Response(value).text();
    const res = await req('PUT', key, body);
    if (!res.ok && res.status !== 201) {
      const err = await res.json().catch(() => ({ err: 'Unknown' }));
      throw new Error(err.err, res.status, key);
    }
    return true;
  }

  export async function del(key: string): Promise<boolean> {
    const res = await req('DELETE', key);
    if (res.status === 404) return false;
    if (!res.ok) throw new Error(await res.text(), res.status, key);
    return true;
  }

  export async function list(prefix = ''): Promise<string[]> {
    const q = prefix ? `?list=1&prefix=${encodeURIComponent(prefix)}` : '?list=1';
    const url = `${KV_URL.replace(/\/$/, '')}/${q}`;

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain',
      },
      signal: AbortSignal.timeout(3000)
    });

    if (!res.ok) throw new Error(await res.text(), res.status);
    const data: ListResult = await res.json() as ListResult;
    return data.keys;
  }

  export async function find(query: string): Promise<FindItem[]> {
    const url = `${KV_URL.replace(/\/$/, '')}/?find=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain',
      },
      signal: AbortSignal.timeout(3000)
    });

    if (!res.ok) throw new Error(await res.text(), res.status);
    const data: FindResult = await res.json() as FindResult;
    return data.items;
  }

  // High-level wrapper
  export const $ = {
    get,
    set: put,
    delete: del,
    list,
    find
  };
}