import { showAction } from "@/stores/action"
import { usePlayerStore } from "@/stores/player"
import { useUserStore } from "@/stores/user"
import { ISong } from "@/types"
import * as api from '@/api'
import router from "@/router"
import { svg } from "./svg"

export const showDefaultSongActions = (song: ISong) => {
    const options = [
        {
            label: '播放',
            value: 'play',
            icon: svg.play
        },
        {
            label: '添加到播放列表',
            value: 'add',
            icon: svg.add
        },
        {
            label: '收藏',
            value: 'favorite',
            icon: svg.love
        },
        {
            label: '下载',
            value: 'download',
            icon: svg.download
        },
        ...song.artists.map(artist => ({
            label: '歌手:' + artist.name,
            value: 'artist.' + artist.id,
            icon: svg.people
        })),
        {
            label: '专辑:' + song.album.name,
            value: 'album',
            icon: svg.album
        }
    ]

    const playerStore = usePlayerStore();
    const userStore = useUserStore();

    showAction(options, (option) => {
        if (!option) return

        const action = option.value
        switch (action) {
            case 'play':
                // 播放当前歌曲
                playerStore.playPlaylist([song], 0)
                break
            case 'add':
                // 添加到播放列表
                playerStore.addToPlaylist(song)
                break
            case 'favorite':
                // 收藏歌曲
                userStore.toggleLike(song.id)
                break
            case 'download':
                // 下载歌曲
                const id = song.privilege?.id
                if (id) {
                    api.getSongUrl(id, 320000).then(u => u.data?.sort((a, b) => b.br - a.br)[0])
                        .then(e => window.open(e?.url))
                }
                break
            case 'album':
                // 跳转到专辑详情
                router.push({ name: 'Album', params: { id: song.album.id } })
                break
            default:
                if (action.startsWith('artist.')) {
                    const artistId = action.split('.')[1]
                    router.push({ name: 'Artist', params: { id: artistId } });
                }
        }
    })
}