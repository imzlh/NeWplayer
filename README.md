# 网易云音乐小屏幕播放器

一个专为 402x512 小屏幕设备（智能手表/小屏设备）优化的网易云音乐播放器，基于 Vue 3 + TypeScript + Vite 构建。

## 特性

- **小屏幕优化**: 专为 402x512 分辨率设计，完美适配智能手表等小屏设备
- **完整的播放功能**: 播放/暂停、上一首/下一首、进度拖动、音量控制
- **智能跳过**: 自动检测并跳过无版权或需要VIP的歌曲
- **多种登录方式**: 支持手机号登录和二维码登录
- **手势操作**: 支持左右滑动切歌、点击切换歌词
- **精美动画**: 唱片旋转、歌词滚动、页面过渡动画
- **歌词显示**: 支持原歌词和翻译歌词
- **播放模式**: 顺序播放、随机播放、单曲循环

## 技术栈

- **框架**: Vue 3.5+ (Composition API + `<script setup>`)
- **语言**: TypeScript 5.9+
- **构建工具**: Vite 6.x
- **状态管理**: Pinia 2.x
- **路由**: Vue Router 4.x
- **HTTP客户端**: Axios
- **样式**: SCSS
- **后端API**: [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)

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
- [x] 自动跳过无版权歌曲
- [x] 歌词同步显示
- [x] 播放历史记录

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
git clone <repository-url>
cd netease-music-player

# 安装依赖
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

### 屏幕适配

项目针对 402x512 分辨率进行了优化，主要样式变量在 `src/styles/variables.scss` 中定义:

```scss
$screen-width: 402px;
$screen-height: 512px;
```

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
