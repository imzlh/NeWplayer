// 用户类型
export interface IUser {
  userId: number
  nickname: string
  avatarUrl: string
  signature?: string
  gender?: number
  birthday?: number
  province?: number
  city?: number
  followeds?: number
  follows?: number
  eventCount?: number
  playlistCount?: number
}

// 歌曲类型
export interface ISong {
  id: number
  name: string
  artists: IArtist[]
  album: IAlbum
  duration: number
  url?: string
  picUrl?: string
  lyric?: string
  tlyric?: string
  fee?: number
  privilege?: IPrivilege
}

// 音质信息接口
interface IAudioQuality {
  br: number;                // 比特率
  size: number;              // 文件大小
  sr: number;                // 采样率
  vd: number;                // 音量衰减？
}

// 音质信息接口（添加了fid字段）
interface IAudioQuality {
  br: number;               // 比特率
  fid: number;              // 文件ID
  size: number;             // 文件大小
  vd: number;               // 音量/音质衰减值
  sr: number;               // 采样率
}

// 原曲信息接口（第二个数据中新增的）
interface IOriginSongSimpleData {
  songId: number;
  name: string;
  artists: Array<{
    id: number;
    name: string;
  }>;
  albumMeta: {
    id: number;
    name: string;
  };
}

// 完整的音乐信息接口（做了重要调整）
export interface ISongDetail {
  // 基本信息
  id: number;
  name: string;
  fee: number;               // 0=免费
  dt: number;                // 时长（毫秒）
  publishTime: number;       // 发布时间戳
  pop: number;               // 热度
  no: number;                // 专辑内序号
  version: number;           // 版本号

  // 艺术家信息（可能是数组）
  ar: IArtist[];

  // 专辑信息
  al: IAlbum;

  // 音质信息（注意：sq和hr可能是null）
  h?: IAudioQuality;         // 高品质
  m?: IAudioQuality;         // 中品质
  l?: IAudioQuality;         // 低品质
  sq?: IAudioQuality | null; // 无损品质（可为null）
  hr?: IAudioQuality | null; // 高解析度（可为null）

  // 版权信息
  cp: number;                // 版权方ID
  copyright: number;         // 版权类型
  originCoverType: number;   // 封面类型

  // 额外信息
  alia: string[];            // 歌曲别名
  tns: string[];            // 翻译名
  mark: number;              // 标记值
  single: number;            // 是否单曲
  mv: number;                // MV ID

  // 原曲信息（可选，针对翻唱/改编歌曲）
  originSongSimpleData?: IOriginSongSimpleData;

  // 其他常用字段
  cd: string;                // 光盘号
  v: number;                 // 版本号？
  rtype: number;             // 资源类型
  st?: number;
  pst?: number;
  t?: number;
  rt?: string;
  crbt?: any;
  cf?: string;
  rtUrl?: any;
  rtUrls?: any[];
  djId?: number;
  s_id?: number;
  resourceState?: boolean;
  tagPicList?: any;
  songJumpInfo?: any;
  entertainmentTags?: any;
  awardTags?: any;
  displayTags?: any[];
  markTags?: any[];
  noCopyrightRcmd?: any;
  rurl?: any;
  a?: any;
}

// 歌手类型
export interface IArtist {
  id: number
  name: string
  picUrl?: string
}

// 专辑类型
export interface IAlbum {
  id: number
  name: string
  picUrl: string
  artist?: IArtist,
  publishTime: number;
}

export interface ITrack {
  id: number
  v: number
  t: number
  at: number
  alg: null
  uid: number
  rcmdReason: string
  rcmdReasonTitle: string
  sc: null
  f: null
  sr: null
  dpr: null
  tr: number
  ratio: number
}

// 歌单类型
export interface IPlaylist {
  id: number
  name: string
  coverImgUrl: string
  description?: string
  playCount: number
  trackCount: number
  creator?: IUser
  tracks?: ITrack[]
  subscribed?: boolean,
  subscribedCount: number,
  shareCount: number,
  commentCount: number,
  trackIds: ITrack[]
}

// 歌单类型
export interface IPlaylistType {
  name: string,
  resourceCount: number,
  imgId: number,
  imgUrl: null | string,
  type: number,
  category: number,
  resourceType: number,
  hot: boolean,
  activity: boolean
}


/**
 * 评论响应接口
 */
export interface CommentResponse {
  hotComments?: IComment[]
  comments?: IComment[]
  total: number
  more: boolean
}

// 权限类型
export interface IPrivilege {
  id: number
  fee: number
  payed: number
  pl: number
  dl: number
  sp: number
  cp: number
  subp: number
  cs: boolean
  maxbr: number
  fl: number
}

// 歌词类型
export interface ILyric {
  time: number
  text: string
  transText?: string
}

// 搜索建议类型
export interface ISearchSuggest {
  albums?: IAlbum[]
  artists?: IArtist[]
  songs?: ISong[]
  playlists?: IPlaylist[]
}

// 播放模式
export enum PlayMode {
  Sequence = 0,
  Random = 1,
  Loop = 2,
}

// 播放状态
export interface IPlayerState {
  currentSong: ISong | null
  playlist: ISong[]
  currentIndex: number
  isPlaying: boolean
  progress: number
  duration: number
  volume: number
  playMode: PlayMode
  isMuted: boolean
}

// 轮播图类型
export interface IBanner {
  pic: string
  targetId: number
  targetType: number
  titleColor: string
  typeTitle: string
  url?: string
}

// 推荐歌单类型
export interface IRecommendPlaylist {
  id: number
  name: string
  picUrl: string
  playcount: number
}

// 每日推荐歌曲
export interface IDailySong {
  id: number
  name: string
  artists: IArtist[]
  album: IAlbum
  duration: number
  reason: string
}

// 热搜类型
export interface IHotSearch {
  first: string
  second?: number
  iconType?: number
}

export interface IIPLocation {
  ip: string;
  location: string | null
}

// 评论类型
export interface IComment {
  commentId: number
  content: string
  time: number
  user: IUser
  likedCount: number
  liked: boolean
  replyCount?: number,
  beReplied: IComment[],
  ipLocation: IIPLocation
}

export interface IToplist {
  id: number
  name: string
  coverImgUrl: string
  description?: string
  playCount: number
  trackCount: number
  creator?: IUser
  tracks?: ISong[],
  updateFrequency: string,
  updateTime: number,
}

// MV类型
export interface IMV {
  id: number
  name: string
  artistName: string
  cover: string
  playCount: number
  duration: number
}

// 视频类型
export interface IVideo {
  vid: string
  title: string
  creator: IUser
  coverUrl: string
  playTime: number
  durationms: number
}

// 电台类型
export interface IDJRadio {
  id: number
  name: string
  picUrl: string
  dj: IUser
  desc: string
  subCount: number
  programCount: number
}

// 电台节目类型
export interface IDJProgram {
  id: number
  name: string
  coverUrl: string
  dj: IUser
  radio: IDJRadio
  duration: number
  listenerCount: number
  likedCount: number
}

// 登录响应类型
export interface ILoginResponse {
  code: number
  cookie: string
  token: string
  profile: IUser
  account?: {
    id: number
    userName: string
    type: number
    status: number
    whitelistAuthority: number
    createTime: number
    salt: string
    tokenVersion: number
    ban: number
    baoyueVersion: number
    donateVersion: number
    vipType: number
    viptypeVersion: number
    anonimousUser: boolean
  }
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  data?: T
  message?: string
  [key: string]: any
}
