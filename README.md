# 网易云音乐小屏幕播放器

一个专为小屏幕设备（手表/手机）优化的网易云音乐播放器，基于 Vue 3 + TypeScript + Vite 构建。

## 特性

- **小屏幕优化**: 专为 402x512 分辨率优化，支持自定义缩放，完美适配智能手表等小屏设备
- **完整的播放功能**: 播放/暂停、上一首/下一首、进度拖动、音量控制
- **多种登录方式**: 支持手机号登录和二维码登录
- **触屏优化**: 支持左右滑动切歌和切换歌词、仿iOS底部操作栏等
- **精美动画**: 歌词滚动、页面过渡动画、下滑显示标题...完美的性能与美观的权衡
- **精心优化**: 专门照顾小屏幕，当然要照顾到方方面面：点击显示全文、下滑显示更多...

## 技术栈

- **框架**: Vue 3.5+
- **语言**: TypeScript 5.9+
- **构建工具**: Vite 6.x
- **状态管理**: Pinia 2.x
- **路由**: Vue Router 4.x
- **HTTP客户端**: Axios
- **样式**: SCSS
- **后端API**: NeteaseCloudMusicApiEnhanced

## 功能模块

### 已实现功能

- [x] 首页 - Banner轮播、推荐歌单、新歌速递、热门歌手
- [x] 搜索 - 热搜榜、搜索建议、多类型搜索（单曲/歌单/歌手/专辑）
- [x] 歌单 - 歌单详情、歌曲列表、收藏/取消收藏
- [x] 专辑 - 专辑详情、歌曲列表
- [x] 歌手 - 歌手详情、热门歌曲、专辑列表
- [x] 播放器 - 唱片动画、歌词显示、进度控制、播放模式
- [x] 登录 - 手机号登录、二维码登录
- [x] 用户 - 用户信息、我的歌单、每日推荐、播放历史
- [x] 他人 - 状态、歌单、信息、关注者
- [x] 播放列表管理 - 添加/删除/清空
- [x] 私人FM - 生成/播放/暂停/调整音量
- [x] 评论 - 查看/发布评论
- ...

### 播放控制

- [x] 播放/暂停
- [x] 上一首/下一首
- [x] 进度拖动
- [x] 音量控制
- [x] 播放模式切换（顺序/随机/循环）
- [x] 歌词同步显示
- [x] 播放历史记录
- [x] 切换音质
- [x] 下载
- ...

## 安装和运行

### 前提条件

1. 安装 [Node.js](https://nodejs.org/) (推荐 18+)
2. 安装并运行 [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)

```bash
# 克隆 API 项目
git clone https://github.com/Binaryify/NeteaseCloudMusicApi.git
cd NeteaseCloudMusicApi
npm install
npm start
```

### 安装项目

```bash
# 克隆本项目
git clone https://github.com/imzlh/NeWplayer
cd NeWplayer

# 安装依赖，推荐pnpm
npm install

# 启动开发服务器
npm run dev
```

### 构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
netease-music-player/
├── src/
│   ├── api/              # API 接口封装
│   ├── components/       # 公共组件
│   ├── composables/      # 组合式函数
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia 状态管理
│   ├── styles/           # 全局样式
│   ├── types/            # TypeScript 类型定义
│   ├── utils/            # 工具函数
│   ├── views/            # 页面组件
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 配置说明

### Vite 代理配置

在 `vite.config.ts` 中配置代理以连接到 NeteaseCloudMusicApi:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
},
```

### 应用配置
同样支持环境变量更改KV、API服务器。除了设置环境变量，可以使用内置的 `/op/env` 路由覆盖

| 环境变量 | op query | 说明 |
|:---|:---:|---:|
| `NEWP_API_BASE_URL` | `api_url` | API端点，默认`/@neast` |
| `NEWP_DISABLE_KV` | `disable_kv` | 是否禁用KV |
| `NEWP_KV_API_URL` | `kv_url` | KV API的地址 |
| `NEWP_COOKIE_API_URL` | `cookie_url` | Cookie API的地址 |

**说明**：

 - 如果是个人使用，我们建议部署 `src/example/` 的2个PHP文件。默认地址是`/cgi-bin/{name}`，我们建议将PHP单独放在文件夹内，如`/cgi-bin/cookie/index.php`。<br>
  好处是多端同步，再也不用担心设备太多啦
  如果是公网且开放，强烈建议关闭
 - 强烈建议自行部署API端点。一行就行！<br>
  `npx NeteaseCloudMusicApi@latest`

## 浏览器支持

- Chrome 70+
- Edge 79+
- Safari 12+
- Firefox 63+

## 注意事项

1. **API 服务**: 本项目需要配合 NeteaseCloudMusicApi 使用，请确保 API 服务正常运行
2. **网络环境**: 部分功能需要良好的网络连接，建议在稳定的网络环境下使用
3. **登录状态**: 部分功能（如每日推荐、用户歌单）需要登录后才能使用
4. **版权问题**: 部分歌曲可能因版权原因无法播放，播放器会自动跳过这些歌曲

## 开发计划

- [ ] MV播放
- [ ] 主题切换
- [ ] 多语言支持

## 许可

本项目仅供学习使用，请勿用于商业用途。

## 致谢

- [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi) - 网易云音乐 NodeJS 版 API
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
