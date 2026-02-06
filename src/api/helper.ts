import { ISong, ISongDetail } from "@/api/types";

export const songDetail2Song = (songd: ISongDetail): ISong => ({
    id: songd.id,
    name: songd.name,
    artists: songd.ar,
    album: songd.al,
    duration: songd.dt,
    picUrl: songd.al.picUrl
})