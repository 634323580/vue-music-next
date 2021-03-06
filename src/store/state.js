import { PLAY_MODE, SEARCH_KEY } from '@/assets/js/constant'
import { load } from '@/assets/js/array-store'

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
  fullScreen: false,
  // 收藏列表
  favoriteList: [],
  // 搜索历史
  searchHistory: load(SEARCH_KEY),
  // 播放历史
  playHistory: []
}

export default state
