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
