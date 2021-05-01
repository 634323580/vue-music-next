import { PLAY_MODE } from '@/assets/js/constant'

const state = {
  // 歌单列表
  sequenceList: [],
  // 播放列表
  playList: [],
  // 是否正在播放
  playing: false,
  // 播放模式
  playMode: PLAY_MODE.sequence,
  // 当前播放哪首
  currentIndex: 0,
  // 播放器状态
  fullScreen: false
}

export default state
