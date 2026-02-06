/**
 * Nest
 */

import { songDetail2Song } from './helper'
import { get } from './request'
import type {
  ApiResponse,
  ILoginResponse,
  IUser,
  ISong,
  IPlaylist,
  IArtist,
  IAlbum,
  IBanner,
  IRecommendPlaylist,
  IHotSearch,
  IComment,
  IMV,
  IPlaylistType,
  CommentResponse,
  IToplist,
  ISongDetail,
  IDailyRecommendReason,
  ISongUrl,
  ISongPersonalized,
  IUserCountInfo,
  IHistory,
  IDJProgram,
  IPrivilege,
  IVideo,
  ITagItem,
  ISong2,
  IUserState,
  IUserEvent,
  IMatch
} from '@/api/types'

const nocache = true;

// ==================== 登录相关 ====================

// 手机号登录
export const loginByPhone = (phone: string, password: string, countrycode?: string): Promise<ILoginResponse> => {
  return get('/login/cellphone', { phone, password, countrycode, nocache })
}

// 邮箱登录
export const loginByEmail = (email: string, password: string): Promise<ILoginResponse> => {
  return get('/login', { email, password, nocache })
}

// 发送验证码
export const sendCaptcha = (phone: string, ctcode?: string): Promise<ApiResponse<boolean>> => {
  return get('/captcha/sent', { phone, ctcode, nocache })
}

// 验证验证码
export const verifyCaptcha = (phone: string, captcha: string, ctcode?: string): Promise<ApiResponse<boolean>> => {
  return get('/captcha/verify', { phone, captcha, ctcode, nocache })
}

// 二维码登录 - 获取key
export const getQRKey = (): Promise<ApiResponse<{ unikey: string }>> => {
  return get('/login/qr/key', { cookie: 'os=pc;', nocache })
}

// 二维码登录 - 生成二维码
export const createQR = (key: string, qrimg = true): Promise<ApiResponse<{ qrurl: string; qrimg: string }>> => {
  return get('/login/qr/create', { key, qrimg, nocache })
}

// 二维码登录 - 检测扫描状态
export const checkQR = (key: string): Promise<ApiResponse<{ code: number; message?: string; cookie?: string }>> => {
  return get('/login/qr/check', { key, nocache })
}

// 刷新登录
export const refreshLogin = (): Promise<ApiResponse> => {
  return get('/login/refresh', { nocache })
}

// 获取登录状态
export const getLoginStatus = (): Promise<ApiResponse<{ profile: IUser; account: IUserState }>> => {
  return get('/login/status', { nocache })
}

// 退出登录
export const logout = (): Promise<ApiResponse> => {
  return get('/logout', { nocache })
}

// ==================== 用户相关 ====================

// 获取用户详情
export const getUserDetail = (uid: number): Promise<ApiResponse & { profile: IUser; level: number; listenSongs: number, peopleCanSeeMyPlayRecord: boolean }> => {
  return get('/user/detail', { uid })
}

// 用户follower
export const getUserFollower = (uid: number, limit = 30, offset = 0): Promise<ApiResponse & { more: boolean, size: number, followeds: IUser[] }> => 
  get('/user/followeds', { uid, limit, offset })

// follows
export const getUserFollows = (uid: number, limit = 30, offset = 0): Promise<ApiResponse & { more: boolean, size: number, follow: IUser[] }> => 
  get('/user/follows', { uid, limit, offset })

// 关注/取消关注, 1=关注, 0=取消
export const followUser = (id: number, t: number = 1): Promise<ApiResponse> => {
  return get('/follow', { id, t, nocache })
}

// 用户动态
export const getUserEvent = (uid: number, limit = 30, lasttime = 0): Promise<ApiResponse & { more: boolean, size: number, lasttime: number, events: IUserEvent[] }> => 
  get('/user/event', { uid, limit, lasttime, nocache })

// 获取用户信息
export const getUserSubcount = (): Promise<ApiResponse & IUserCountInfo> => {
  return get('/user/subcount', { nocache })
}

// 获取用户歌单
export const getUserPlaylist = (uid: number, limit = 30, offset = 0): Promise<ApiResponse<{ playlist: IPlaylist[], more: boolean }>> => {
  return get('/user/playlist', { uid, limit, offset, nocache })
}

// 获取用户播放记录, 0=all, 1=week
export const getUserRecord = (uid: number, type = 0): Promise<ApiResponse & { allData?: IHistory[] }> => {
  return get('/user/record', { uid, type, nocache })
}

// 获取用户电台
export const getUserDJ = (uid: number): Promise<ApiResponse & { count: number, more: boolean, programs: IDJProgram[] }> => {
  return get('/user/dj', { uid, nocache })
}

// 更新用户信息
export const updateUserProfile = (data: Partial<IUserState>): Promise<ApiResponse> => {
  return get('/user/update', { ...data, nocache })
}

// ==================== 歌曲相关 ====================

// 获取歌曲详情
export const getSongDetail = (ids: number | number[]): Promise<ApiResponse<{ songs: ISongDetail[]; privileges: any[] }>> => {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids
  return get('/song/detail', { ids: idStr })
}

export const getSongDetail2 = (ids: number | number[]): Promise<ApiResponse<{ songs: ISong[]; privileges: IPrivilege[] }>> => 
  getSongDetail(ids).then(res => ({
    code: res.code,
    songs: res.songs.map(songDetail2Song),
    privileges: res.privileges,
  })) as any

// 获取歌曲URL
export const getSongUrl = (id: number, br = 999000): Promise<ApiResponse<ISongUrl[]>> => {
  return get('/song/url', { id, br })
}

// 检查音乐是否可用
export const checkMusic = (id: number, br = 999000): Promise<ApiResponse & { success: boolean; message: string }> => {
  return get('/check/music', { id, br })
}

// 获取歌词
export const getLyric = (id: number): Promise<ApiResponse & { lrc: { lyric?: string }; tlyric: { lyric?: string }; romalrc: { lyric?: string } }> => {
  return get('/lyric', { id })
}

// 喜欢音乐
export const likeSong = (id: number, like = true): Promise<ApiResponse & { playlistId: number }> => {
  return get('/like', { id, like, nocache })
}

// 获取喜欢音乐列表
export const getLikeList = (uid: number): Promise<ApiResponse & { ids: number[]; checkPoint: number }> => {
  return get('/likelist', { uid, nocache })
}

// 获取相似音乐
export const getSimiSong = (id: number): Promise<ApiResponse & { songs: ISong[] }> => {
  return get('/simi/song', { id, nocache })
}

// ==================== 歌单相关 ====================

// 获取歌单详情
export const getPlaylistDetail = (id: number, s = 8): Promise<ApiResponse & { playlist: IPlaylist; privileges: IPrivilege[]; relatedVideos?: IVideo[] }> => {
  return get('/playlist/detail', { id, s })
}

// 获取歌单所有歌曲
export const getPlaylistTracks = (id: number, limit = 1000, offset = 0): Promise<ApiResponse & { songs: ISong[]; privileges: IPrivilege[] }> => {
  return get('/playlist/track/all', { id, limit, offset })
}

// 获取精品歌单
export const getHighQualityPlaylists = (cat = '全部', limit = 20, before?: number): Promise<ApiResponse & { playlists: IPlaylist[]; lasttime: number; more: boolean; total: number }> => {
  return get('/top/playlist/highquality', { cat, limit, before })
}

// 获取网友精选碟歌单
export const getTopPlaylists = (order = 'hot', cat = '全部', limit = 50, offset = 0): Promise<ApiResponse & { playlists: IPlaylist[]; total: number; more: boolean }> => {
  return get('/top/playlist', { order, cat, limit, offset })
}

// 获取相关歌单推荐
export const getRelatedPlaylists = (id: number): Promise<ApiResponse<{ playlists: IPlaylist[] }>> => {
  return get('/related/playlist', { id })
}

// 获取歌单分类
export const getPlaylistCatlist = (): Promise<ApiResponse<{
  code: number, all: IPlaylistType, sub: IPlaylistType[], categories: Record</* 数字字符串，如"1" */string, string>
}>> => {
  return get('/playlist/catlist')
}

// 获取热门歌单分类
export const getPlaylistHotCategories = (): Promise<ApiResponse<{ tags: ITagItem[] }>> => {
  return get('/playlist/hot')
}

// 收藏/取消收藏歌单
export const subscribePlaylist = (id: number, t: 1 | 2): Promise<ApiResponse> => {
  return get('/playlist/subscribe', { id, t, nocache })
}

// 新建歌单
export const createPlaylist = (name: string, privacy?: 0 | 10, type?: 'NORMAL' | 'VIDEO' | 'SHARED'): Promise<ApiResponse> => {
  return get('/playlist/create', { name, privacy, type, nocache })
}

// 删除歌单
export const deletePlaylist = (id: number): Promise<ApiResponse> => {
  return get('/playlist/delete', { id, nocache })
}

// 对歌单添加或删除歌曲
export const manipulatePlaylistTracks = (op: 'add' | 'del', pid: number, tracks: number | number[]): Promise<ApiResponse> => {
  const trackStr = Array.isArray(tracks) ? tracks.join(',') : tracks
  return get('/playlist/tracks', { op, pid, tracks: trackStr, nocache })
}

// ==================== 搜索相关 ====================

// 搜索
export const search = (keywords: string, type = 1, limit = 30, offset = 0): Promise<ApiResponse> => {
  return get('/search', { keywords, type, limit, offset, nocache })
}

// 获取默认搜索关键词
export const getDefaultSearchKeyword = (): Promise<ApiResponse<{ realkeyword: string; showKeyword: string }>> => {
  return get('/search/default')
}

// 获取热搜列表(简略)
export const getHotSearch = (): Promise<ApiResponse<{ hots: IHotSearch[] }>> => {
  return get('/search/hot')
}

// 获取热搜列表(详细)
export const getHotSearchDetail = (): Promise<ApiResponse<{ searchWord: string; score: number; content: string; source: number; iconType: number; iconUrl: string; url: string; alg: string }[]>> => {
  return get('/search/hot/detail')
}

// 获取搜索建议
export const getSearchSuggest = (keywords: string, type = 'mobile'): Promise<ApiResponse & { result: { allMatch: IMatch[] } }> => {
  return get('/search/suggest', { keywords, type, nocache })
}

// 搜索多重匹配
export const getSearchMultimatch = (keywords: string): Promise<ApiResponse> => {
  return get('/search/multimatch', { keywords, nocache })
}

// ==================== 推荐相关 ====================

// 获取banner
export const getBanners = (type = 1): Promise<ApiResponse<{ banners: IBanner[] }>> => {
  return get('/banner', { type })
}

// 获取推荐歌单
export const getRecommendPlaylists = (limit = 10): Promise<ApiResponse<{ result: IRecommendPlaylist[] }>> => {
  return get('/personalized', { limit })
}

// 获取每日推荐歌单(需登录)
export const getDailyRecommendPlaylists = (): Promise<ApiResponse<{ recommend: IPlaylist[] }>> => {
  return get('/recommend/resource')
}

// 获取每日推荐歌曲(需登录)
export const getDailyRecommendSongs = (): Promise<ApiResponse<{ dailySongs: ISongDetail[]; recommendReasons: IDailyRecommendReason[] }>> => {
  return get('/recommend/songs')
}

// 获取私人FM
export const getPersonalFM = (): Promise<ApiResponse<ISong2[]>> => {
  return get('/personal_fm', { nocache })
}

// FM: 扔进垃圾桶
export const fmTrash = (id: number): Promise<ApiResponse> => {
  return get('/fm_trash', { id, nocache })
}

// 推荐新音乐
export const getNewSongs = (limit = 10): Promise<ApiResponse<{ result: ISongPersonalized[] }>> => {
  return get('/personalized/newsong', { limit, nocache })
}

// ==================== 歌手相关 ====================

// 获取歌手详情
export const getArtistDetail = (id: number): Promise<ApiResponse<IArtist>> => {
  return get('/artist/detail', { id })
}

// 获取歌手单曲
export const getArtistSongs = (id: number, limit = 50, offset = 0): Promise<ApiResponse<{ artist: IArtist; hotSongs: ISong[]; more: boolean }>> => {
  return get('/artists', { id, limit, offset })
}

// 获取歌手专辑
export const getArtistAlbums = (id: number, limit = 30, offset = 0): Promise<ApiResponse<{ artist: IArtist; hotAlbums: IAlbum[]; more: boolean }>> => {
  return get('/artist/album', { id, limit, offset })
}

// 获取歌手描述
export const getArtistDesc = (id: number): Promise<ApiResponse> => {
  return get('/artist/desc', { id })
}

// 获取相似歌手
export const getSimiArtists = (id: number): Promise<ApiResponse<{ artists: IArtist[] }>> => {
  return get('/simi/artist', { id })
}

// 获取热门歌手
export const getHotArtists = (limit = 30, offset = 0): Promise<ApiResponse & { artist: IArtist; more: boolean }> => {
  return get('/top/artists', { limit, offset })
}

// 歌手分类列表
export const getArtistList = (cat = 1001, limit = 30, offset = 0, initial?: string): Promise<ApiResponse & { artist: IArtist }> => {
  return get('/artist/list', { cat, limit, offset, initial })
}

// 收藏的歌手列表
export const getSubArtists = (): Promise<ApiResponse<{ data: IArtist[]; hasMore: boolean; count: number }>> => {
  return get('/artist/sublist', { nocache })
}

// 收藏/取消收藏歌手
export const subscribeArtist = (id: number, t: 1 | 0): Promise<ApiResponse<null>> => {
  return get('/artist/sub', { id, t, nocache })
}

// ==================== 专辑相关 ====================

// 获取专辑内容
export const getAlbum = (id: number): Promise<ApiResponse<{ album: IAlbum; songs: ISong[] }>> => {
  return get('/album', { id })
}

// 获取最新专辑
export const getNewAlbums = (limit = 20, offset = 0, area = 'ALL', type = 'new'): Promise<ApiResponse & { albums: IAlbum[]; total: number }> => {
  return get('/album/new', { limit, offset, area, type })
}

// 收藏的专辑列表
export const getSubAlbums = (limit = 25, offset = 0): Promise<ApiResponse<{ data: IAlbum[]; hasMore: boolean; count: number }>> => {
  return get('/album/sublist', { limit, offset, nocache })
}

// 收藏/取消收藏专辑
export const subscribeAlbum = (id: number, t: 1 | 0): Promise<ApiResponse> => {
  return get('/album/sub', { id, t , nocache })
}

// ==================== 排行榜相关 ====================

// 获取所有榜单
export const getToplist = (): Promise<ApiResponse<{ list: IPlaylist[]; artistToplist: any }>> => {
  return get('/toplist')
}

// 获取榜单详情
export const getToplistDetail = (): Promise<ApiResponse> => {
  return get('/toplist/detail')
}

// 歌手榜
export const getArtistToplist = (type = 1): Promise<ApiResponse> => {
  return get('/toplist/artist', { type })
}

// ==================== MV相关 ====================

// 获取MV详情
export const getMVDetail = (mvid: number): Promise<ApiResponse> => {
  return get('/mv/detail', { mvid })
}

// 获取MV播放地址
export const getMVUrl = (id: number, r = 1080): Promise<ApiResponse<{ id: number; url: string; r: number; size: number }>> => {
  return get('/mv/url', { id, r })
}

// 获取最新MV
export const getNewMVs = (limit = 30, area = '全部', offset = 0): Promise<ApiResponse<{ data: IMV[]; hasMore: boolean }>> => {
  return get('/mv/first', { limit, area, offset })
}

// 获取推荐MV
export const getRecommendMVs = (): Promise<ApiResponse<{ result: IMV[] }>> => {
  return get('/personalized/mv')
}

// 获取MV排行
export const getTopMVs = (limit = 30, offset = 0, area = '', publishTime = ''): Promise<ApiResponse<{ data: IMV[]; hasMore: boolean; updateTime: number }>> => {
  return get('/top/mv', { limit, offset, area, publishTime })
}

// 收藏的MV列表
export const getSubMVs = (): Promise<ApiResponse<{ data: IMV[]; hasMore: boolean; count: number }>> => {
  return get('/mv/sublist')
}

// 收藏/取消收藏MV
export const subscribeMV = (mvid: number, t: 1 | 0): Promise<ApiResponse> => {
  return get('/mv/sub', { mvid, t })
}

// ==================== 评论相关 ====================

// 获取歌曲评论
export const getSongComments = (id: number, limit = 20, offset = 0, before?: number): Promise<ApiResponse<{ comments: IComment[]; hotComments: IComment[]; total: number; more: boolean; moreHot: boolean }>> => {
  return get('/comment/music', { id, limit, offset, before })
}

// 获取歌单评论
export const getPlaylistComments = (id: number, limit = 20, offset = 0, before?: number): Promise<ApiResponse<{ comments: IComment[]; hotComments: IComment[]; total: number; more: boolean; moreHot: boolean }>> => {
  return get('/comment/playlist', { id, limit, offset, before })
}

// 获取专辑评论
export const getAlbumComments = (id: number, limit = 20, offset = 0, before?: number): Promise<ApiResponse<{ comments: IComment[]; hotComments: IComment[]; total: number; more: boolean; moreHot: boolean }>> => {
  return get('/comment/album', { id, limit, offset, before })
}

// 获取MV评论
export const getMVComments = (id: number, limit = 20, offset = 0, before?: number): Promise<ApiResponse<{ comments: IComment[]; hotComments: IComment[]; total: number; more: boolean; moreHot: boolean }>> => {
  return get('/comment/mv', { id, limit, offset, before })
}

// 获取热门评论
export const getHotComments = (id: number, type: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0, limit = 20, offset = 0, before?: number): Promise<ApiResponse<{ hotComments: IComment[]; hasMore: boolean; topComments: IComment[] }>> => {
  return get('/comment/hot', { id, type, limit, offset, before })
}


// ==================== 其他 ====================

// 签到
export const dailySignin = (type = 1): Promise<ApiResponse> => {
  return get('/daily_signin', { type, nocache })
}

// 获取首页轮播图
export const getHomepageBlockPage = (refresh = false): Promise<ApiResponse> => {
  return get('/homepage/block/page', { refresh })
}

// 获取Dragon Ball
// ？？
// export const getDragonBall = (): Promise<ApiResponse> => {
//   return get('/homepage/dragon/ball')
// }

// 云村热评
// 官方下架
// export const getHotwallList = (): Promise<ApiResponse<{ id: number; content: string; simpleUserInfo: IUser }[]>> => {
//   return get('/comment/hotwall/list')
// }

// 获取音乐url - 备用方案
export const getMusicUrl = (id: number): string => {
  return `https://music.163.com/song/media/outer/url?id=${id}`
}

/**
 * 获取歌曲评论
 * @param id 歌曲ID
 * @param limit 数量
 * @param offset 偏移量
 * @param before 分页参数
 */
export const getMusicComment = (
  id: number,
  limit = 20,
  offset = 0,
  before?: number
): Promise<ApiResponse<CommentResponse>> => {
  return get('/comment/music', { id, limit, offset, before })
}

/**
 * 获取专辑评论
 * @param id 专辑ID
 * @param limit 数量
 * @param offset 偏移量
 * @param before 分页参数
 */
export const getAlbumComment = (
  id: number,
  limit = 20,
  offset = 0,
  before?: number
): Promise<CommentResponse> => 
  get('/comment/album', { id, limit, offset, before })

/**
 * 获取歌单评论
 * @param id 歌单ID
 * @param limit 数量
 * @param offset 偏移量
 * @param before 分页参数
 */
export const getPlaylistComment = (
  id: number,
  limit = 20,
  offset = 0,
  before?: number
): Promise<ApiResponse<CommentResponse>> => {
  return get('/comment/playlist', { id, limit, offset, before })
}

/**
 * 获取热门评论
 * @param id 资源ID
 * @param type 资源类型: 0=歌曲, 2=歌单, 3=专辑
 * @param limit 数量
 * @param offset 偏移量
 * @param before 分页参数
 */
export const getHotComment = (
  id: number,
  type: 0 | 2 | 3,
  limit = 20,
  offset = 0,
  before?: number
): Promise<ApiResponse<CommentResponse>> => 
  get('/comment/hot', { id, type, limit, offset, before })

/**
 * 点赞评论
 * @param id 资源ID
 * @param cid 评论ID
 * @param type 资源类型: 0=歌曲, 2=歌单, 3=专辑
 */
export const likeComment = (
  id: number,
  cid: number,
  type: 0 | 2 | 3
): Promise<ApiResponse> => 
  get('/comment/like', { id, cid, t: 1, type, nocache })

/**
 * 取消点赞评论
 * @param id 资源ID
 * @param cid 评论ID
 * @param type 资源类型: 0=歌曲, 2=歌单, 3=专辑
 */
export const unlikeComment = (
  id: number,
  cid: number,
  type: 0 | 2 | 3
): Promise<ApiResponse> => 
  get('/comment/like', { id, cid, t: 0, type, nocache })

/**
 * 发送评论
 * @param id 资源ID
 * @param type 资源类型: 0=歌曲, 2=歌单, 3=专辑
 * @param content 评论内容
 */
export const sendComment = (
  id: number,
  type: 0 | 2 | 3,
  content: string
): Promise<ApiResponse> => 
  get('/comment', { id, type, t: 1, content, nocache })

/**
 * 回复评论
 * @param id 资源ID
 * @param type 资源类型: 0=歌曲, 2=歌单, 3=专辑
 * @param content 评论内容
 * @param commentId 被回复的评论ID
 */
export const replyComment = (
  id: number,
  type: 0 | 2 | 3,
  content: string,
  commentId: number
): Promise<ApiResponse> => 
  get('/comment', { id, type, t: 2, content, commentId, nocache })

/**
 * 删除评论
 * @param id 资源ID
 * @param type 资源类型: 0=歌曲, 2=歌单, 3=专辑
 * @param commentId 评论ID
 */
export const deleteComment = (
  id: number,
  type: 0 | 2 | 3,
  commentId: number
): Promise<ApiResponse> => 
  get('/comment', { id, type, t: 0, commentId, nocache })

export const getAllTopLists = () =>
  get<{ list: IToplist[] }>('/toplist');