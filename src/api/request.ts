import axios, { AxiosInstance, AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types'

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: '/api',
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
    if (config.params) {
      config.params.timestamp = Date.now()
    } else {
      config.params = { timestamp: Date.now() }
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