# 快速开始指南

## 环境要求

- Node.js 18+ 
- npm 或 yarn
- NeteaseCloudMusicApi 服务

## 安装步骤

### 1. 启动 NeteaseCloudMusicApi 服务

```bash
# 克隆 API 项目
git clone https://github.com/Binaryify/NeteaseCloudMusicApi.git
cd NeteaseCloudMusicApi

# 安装依赖
npm install

# 启动服务（默认端口 3000）
npm start
```

### 2. 安装本项目依赖

```bash
cd netease-music-player

# 安装依赖
npm install

# 如果遇到权限问题，可以尝试：
npm install --legacy-peer-deps
```

### 3. 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:5173 启动

### 4. 构建生产版本

```bash
npm run build
```

构建后的文件将在 `dist` 目录中

## 常见问题

### 1. 无法连接到 API

确保 NeteaseCloudMusicApi 服务已启动，并且在 `vite.config.ts` 中配置了正确的代理：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',  // 确保这是正确的 API 地址
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
},
```

### 2. 登录失败

- 确保网络连接正常
- 检查手机号和密码是否正确
- 如果使用二维码登录，确保使用网易云音乐 APP 扫描

### 3. 歌曲无法播放

- 部分歌曲需要 VIP 权限
- 部分歌曲可能因版权问题无法播放
- 播放器会自动跳过这些歌曲

## 项目结构说明

```
src/
├── api/              # API 接口封装
│   ├── index.ts      # 所有 API 接口
│   └── request.ts    # axios 配置
├── components/       # 公共组件
│   ├── Banner.vue    # 轮播图
│   ├── Loading.vue   # 加载动画
│   ├── MiniPlayer.vue # 迷你播放器
│   ├── Modal.vue     # 模态框
│   ├── Nav.vue       # 底部导航
│   ├── PlaylistCard.vue # 歌单卡片
│   ├── Skeleton.vue  # 骨架屏
│   ├── SongListItem.vue # 歌曲列表项
│   └── Toast.vue     # 提示消息
├── router/           # 路由配置
│   └── index.ts
├── stores/           # Pinia 状态管理
│   ├── player.ts     # 播放器状态
│   └── user.ts       # 用户状态
├── styles/           # 全局样式
│   ├── global.scss   # 全局样式
│   └── variables.scss # 变量定义
├── types/            # TypeScript 类型
│   └── index.ts
├── utils/            # 工具函数
│   └── lyric.ts      # 歌词解析等
├── views/            # 页面组件
│   ├── Album.vue     # 专辑详情
│   ├── Artist.vue    # 歌手详情
│   ├── DailyRecommend.vue # 每日推荐
│   ├── History.vue   # 播放历史
│   ├── Home.vue      # 首页
│   ├── Login.vue     # 登录
│   ├── NotFound.vue  # 404
│   ├── PlayCard.vue  # 播放器
│   ├── Playlist.vue  # 歌单详情
│   ├── Search.vue    # 搜索
│   ├── User.vue      # 用户中心
│   └── UserPlaylists.vue # 我的歌单
├── App.vue           # 根组件
└── main.ts           # 入口文件
```

## 功能列表

### 已实现功能

- [x] 首页 - Banner轮播、推荐歌单、新歌速递、热门歌手
- [x] 搜索 - 热搜榜、搜索建议、多类型搜索
- [x] 歌单 - 歌单详情、歌曲列表、收藏
- [x] 专辑 - 专辑详情、歌曲列表
- [x] 歌手 - 歌手详情、热门歌曲、专辑
- [x] 播放器 - 唱片动画、歌词显示、进度控制
- [x] 登录 - 手机号登录、二维码登录
- [x] 用户 - 用户信息、我的歌单、每日推荐、播放历史

### 播放控制

- [x] 播放/暂停
- [x] 上一首/下一首
- [x] 进度拖动
- [x] 播放模式切换
- [x] 自动跳过无版权歌曲
- [x] 歌词同步显示

## 开发建议

1. 使用 VS Code 编辑器，安装 Volar 插件获得更好的 Vue 3 支持
2. 使用 Chrome DevTools 的 Vue 插件进行调试
3. 在移动设备上测试时，可以使用 Chrome 的 Device Mode 模拟 402x512 分辨率

## 浏览器兼容性

- Chrome 70+
- Edge 79+
- Safari 12+
- Firefox 63+

## 注意事项

1. 本项目需要配合 NeteaseCloudMusicApi 使用
2. 部分功能需要登录后才能使用
3. 请遵守网易云音乐的使用条款
