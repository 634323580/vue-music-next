<template>
  <div
    v-show="playList.length"
    class="player"
  >
    <transition
      name="normal"
      @enter="enter"
      @after-enter="afterEnter"
      @leave="leave"
      @after-leave="afterLeave"
    >
      <div
        class="normal-player"
        v-show="fullScreen"
      >
        <div class="background">
          <img :src="currentSong.pic">
        </div>
        <div class="top">
          <div
            class="back"
            @click="goBack"
          >
            <i class="icon-back"></i>
          </div>
          <h1 class="title">{{currentSong.name}}</h1>
          <h2 class="subtitle">{{currentSong.singer}}</h2>
        </div>
        <div
          class="middle"
          @touchstart.prevent="onMiddleTouchStart"
          @touchmove.prevent="onMiddleTouchMove"
          @touchend.prevent="onMiddleTouchEnd"
        >
          <div
            class="middle-l"
            :style="middleLStyle"
          >
            <div
              ref="cdWrapperRef"
              class="cd-wrapper">
              <div
                ref="cdRef"
                class="cd"
              >
                <img
                  ref="cdImageRef"
                  class="image"
                  :class="cdCls"
                  :src="currentSong.pic"
                >
              </div>
            </div>
            <div class="playing-lyric-wrapper">
              <div class="playing-lyric">{{playingLyric}}</div>
            </div>
          </div>
          <scroll
            class="middle-r"
            ref="lyricScrollRef"
            :style="middleRStyle"
          >
            <div class="lyric-wrapper">
              <div v-if="currentLyric" ref="lyricListRef">
                <p
                  class="text"
                  :class="{'current': currentLineNum === index}"
                  v-for="(line, index) in currentLyric.lines"
                  :key="line.num"
                >
                  {{line.txt}}
                </p>
              </div>
              <div class="pure-music" v-show="pureMusicLyric">
                {{pureMusicLyric}}
              </div>
            </div>
          </scroll>
        </div>
        <div class="bottom">
          <div class="dot-wrapper">
            <span class="dot" :class="{'active': currentShow === 'cd'}"></span>
            <span class="dot" :class="{'active': currentShow === 'lyric'}"></span>
          </div>
          <div class="progress-wrapper">
            <span class="time time-l">{{formatTime(currentTime)}}</span>
            <div class="progress-bar-wrapper">
              <progress-bar
                ref="barRef"
                :progress="progress"
                @progress-changing="onProgressChanging"
                @progress-changed="onProgressChanged"
              >
              </progress-bar>
            </div>
            <span class="time time-r">{{formatTime(currentSong.duration)}}</span>
          </div>
          <div class="operators">
            <div class="icon i-left">
              <i @click="changeMode" :class="modeIcon"></i>
            </div>
            <div class="icon i-left" :class="disableCls">
              <i @click="prev" class="icon-prev"></i>
            </div>
            <div class="icon i-center" :class="disableCls">
              <i @click="togglePlay" :class="playIcon"></i>
            </div>
            <div class="icon i-right" :class="disableCls">
              <i  @click="next" class="icon-next"></i>
            </div>
            <div class="icon i-right">
              <i
                @click="toggleFavorite(currentSong)"
                :class="getFavoriteIcon(currentSong)"
              >
              </i>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <mini-player
      :toggle-play="togglePlay"
      :progress="progress"
    >
    </mini-player>
    <audio
      ref="audioRef"
      @pause="pause"
      @canplay="ready"
      @error="error"
      @timeupdate="updateTime"
      @ended="end"
    >
    </audio>
  </div>
</template>

<script>
import { useStore } from 'vuex'
import { computed, watch, ref, nextTick } from 'vue'
import useMode from './use-mode'
import useFavorite from './use-favorite'
import useCd from './use-cd'
import useLyric from './use-lyric'
import useMiddleInteractive from './use-middle-interactive'
import useAnimation from './use-animation'
import usePlayHistory from './use-play-history'
import ProgressBar from './progress-bar'
import MiniPlayer from './mini-player'
import { formatTime } from '@/assets/js/util'
import { PLAY_MODE } from '@/assets/js/constant'
import Scroll from '@/components/base/scroll/scroll.vue'
export default {
  name: 'player',
  components: {
    ProgressBar,
    Scroll,
    MiniPlayer
  },
  setup() {
    const audioRef = ref(null)
    const barRef = ref(null)
    const songReady = ref(false)
    const currentTime = ref(0)
    let progressChanging = false

    // 获取vuex store
    const store = useStore()
    // 播放器状态 true=>全屏 false=>收起
    const fullScreen = computed(() => store.state.fullScreen)
    // 当前播放的歌曲
    const currentSong = computed(() => store.getters.currentSong)
    // 播放状态 true=>播放 false=>暂停
    const playing = computed(() => store.state.playing)
    // 当前播放歌曲索引
    const currentIndex = computed(() => store.state.currentIndex)
    // 当前播放模式
    const playMode = computed(() => store.state.playMode)

    // 播放模式hooks
    const { modeIcon, changeMode } = useMode()
    // 收藏hooks
    const { getFavoriteIcon, toggleFavorite } = useFavorite()
    // cd hooks
    const { cdCls, cdRef, cdImageRef } = useCd()
    // 歌词
    const { currentLyric, currentLineNum, playLyric, stopLyric, lyricScrollRef, lyricListRef, pureMusicLyric, playingLyric } = useLyric({ songReady, currentTime })
    const { currentShow, middleLStyle, middleRStyle, onMiddleTouchStart, onMiddleTouchMove, onMiddleTouchEnd } = useMiddleInteractive()
    // 动画
    const { cdWrapperRef, enter, afterEnter, leave, afterLeave } = useAnimation()
    // 播放历史
    const { savePlay } = usePlayHistory()
    // 播放列表
    const playList = computed(() => store.state.playList)

    // 播放按钮icon
    const playIcon = computed(() => {
      return playing.value ? 'icon-pause' : 'icon-play'
    })

    // 当前播放进度
    const progress = computed(() => {
      return currentTime.value / currentSong.value.duration
    })

    const disableCls = computed(() => {
      return songReady.value ? '' : 'disable'
    })

    // 监听播放歌曲切换
    watch(currentSong, (newSong) => {
      if (!newSong.id || !newSong.url) {
        return
      }
      currentTime.value = 0
      songReady.value = false
      const audioEl = audioRef.value
      audioEl.src = newSong.url
      audioEl.play()
      store.commit('setPlayingState', true)
    })

    // 监听播放状态
    watch(playing, (newPlaying) => {
      if (!songReady.value) {
        return
      }
      const audioEl = audioRef.value
      if (newPlaying) {
        audioEl.play()
        playLyric()
      } else {
        audioEl.pause()
        stopLyric()
      }
    })

    // 展开播放器后重新设置进度offset
    watch(fullScreen, async (newFullScreen) => {
      if (newFullScreen) {
        await nextTick()
        barRef.value.setOffset(progress.value)
      }
    })

    // 收起播放器
    function goBack() {
      store.commit('setFullScreen', false)
    }

    // 切换播放状态
    function togglePlay() {
      if (!songReady.value) {
        return
      }
      store.commit('setPlayingState', !playing.value)
    }

    // 暂停播放
    function pause() {
      store.commit('setPlayingState', false)
    }

    // 下一首
    function prev() {
      const list = playList.value
      // 播放列表没有歌或者缓冲没有准备好
      if (!songReady.value || !list.length) {
        return
      }
      // 播放列表如果只有一首歌，则循环播放
      if (list.length === 1) {
        loop()
      } else {
        let index = currentIndex.value - 1
        if (index === -1) {
          index = list.length - 1
        }
        store.commit('setCurrentIndex', index)
      }
    }

    // 上一首
    function next() {
      const list = playList.value
      // 播放列表没有歌或者缓冲没有准备好
      if (!songReady.value || !list.length) {
        return
      }
      // 播放列表如果只有一首歌，则循环播放
      if (list.length === 1) {
        loop()
      } else {
        let index = currentIndex.value + 1
        if (index === list.length) {
          index = 0
        }
        store.commit('setCurrentIndex', index)
      }
    }

    // 循环播放
    function loop() {
      const audioEl = audioRef.value
      audioEl.currentTime = 0
      audioEl.play()
      store.commit('setPlayingState', true)
    }

    function ready() {
      if (songReady.value) {
        return
      }
      songReady.value = true
      console.log('ready')
      playLyric()
      savePlay(currentSong.value)
    }

    function error() {
      songReady.value = true
    }

    function updateTime(e) {
      if (!progressChanging) {
        currentTime.value = e.target.currentTime
      }
    }

    // 进度条onTouchMove
    function onProgressChanging(progress) {
      progressChanging = true
      currentTime.value = currentSong.value.duration * progress
      playLyric()
      stopLyric()
    }

    // 进度条onTouchEnd
    function onProgressChanged(progress) {
      progressChanging = false
      audioRef.value.currentTime = currentTime.value = currentSong.value.duration * progress
      if (!playing.value) {
        store.commit('setPlayingState', true)
      }
      playLyric()
    }

    // 播放结束
    function end() {
      currentTime.value = 0
      if (playMode.value === PLAY_MODE.loop) {
        loop()
      } else {
        next()
      }
    }

    return {
      audioRef,
      barRef,
      fullScreen,
      currentTime,
      currentSong,
      playList,
      playIcon,
      disableCls,
      progress,
      goBack,
      togglePlay,
      pause,
      prev,
      next,
      ready,
      error,
      updateTime,
      formatTime,
      onProgressChanging,
      onProgressChanged,
      end,
      // mode
      modeIcon,
      changeMode,
      // favorite
      getFavoriteIcon,
      toggleFavorite,
      // cd
      cdCls,
      cdRef,
      cdImageRef,
      // lyric
      currentLyric,
      currentLineNum,
      pureMusicLyric,
      playingLyric,
      lyricScrollRef,
      lyricListRef,
      // middle-interactive
      currentShow,
      middleLStyle,
      middleRStyle,
      onMiddleTouchStart,
      onMiddleTouchMove,
      onMiddleTouchEnd,
      // animation
      cdWrapperRef,
      enter,
      afterEnter,
      leave,
      afterLeave
    }
  }
}
</script>

<style lang="scss" scoped>
  .player {
    .normal-player {
      position: fixed;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      z-index: 150;
      background: $color-background;
      .background {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        opacity: 0.6;
        filter: blur(20px);

        img {
          width: 100%;
          height: 100%;
        }
      }
      .top {
        position: relative;
        margin-bottom: 25px;
        .back {
          position: absolute;
          top: 0;
          left: 6px;
          z-index: 50;
        }
        .icon-back {
          display: block;
          padding: 9px;
          font-size: $font-size-large-x;
          color: $color-theme;
          transform: rotate(-90deg);
        }
        .title {
          width: 70%;
          margin: 0 auto;
          line-height: 40px;
          text-align: center;
          @include no-wrap();
          font-size: $font-size-large;
          color: $color-text;
        }
        .subtitle {
          line-height: 20px;
          text-align: center;
          font-size: $font-size-medium;
          color: $color-text;
        }
      }
      .middle {
        position: fixed;
        width: 100%;
        top: 80px;
        bottom: 170px;
        white-space: nowrap;
        font-size: 0;
        .middle-l {
          display: inline-block;
          vertical-align: top;
          position: relative;
          width: 100%;
          height: 0;
          padding-top: 80%;
          .cd-wrapper {
            position: absolute;
            left: 10%;
            top: 0;
            width: 80%;
            box-sizing: border-box;
            height: 100%;
            .cd {
              width: 100%;
              height: 100%;
              border-radius: 50%;
              img {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                box-sizing: border-box;
                border-radius: 50%;
                border: 10px solid rgba(255, 255, 255, 0.1);
              }
              .playing {
                animation: rotate 20s linear infinite
              }
              // .paused{
              //   animation-play-state: paused;
              // }
            }
          }
          .playing-lyric-wrapper {
            width: 80%;
            margin: 30px auto 0 auto;
            overflow: hidden;
            text-align: center;
            .playing-lyric {
              height: 20px;
              line-height: 20px;
              font-size: $font-size-medium;
              color: $color-text-l;
            }
          }
        }
        .middle-r {
          display: inline-block;
          vertical-align: top;
          width: 100%;
          height: 100%;
          overflow: hidden;
          .lyric-wrapper {
            width: 80%;
            margin: 0 auto;
            overflow: hidden;
            text-align: center;
            .text {
              line-height: 32px;
              color: $color-text-l;
              font-size: $font-size-medium;
              &.current {
                color: $color-text;
              }
            }
            .pure-music {
              padding-top: 50%;
              line-height: 32px;
              color: $color-text-l;
              font-size: $font-size-medium;
            }
          }
        }
      }
      .bottom {
        position: absolute;
        bottom: 50px;
        width: 100%;
        .dot-wrapper {
          text-align: center;
          font-size: 0;
          .dot {
            display: inline-block;
            vertical-align: middle;
            margin: 0 4px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: $color-text-l;
            &.active {
              width: 20px;
              border-radius: 5px;
              background: $color-text-ll;
            }
          }
        }
        .progress-wrapper {
          display: flex;
          align-items: center;
          width: 80%;
          margin: 0px auto;
          padding: 10px 0;
          .time {
            color: $color-text;
            font-size: $font-size-small;
            flex: 0 0 40px;
            line-height: 30px;
            width: 40px;
            &.time-l {
              text-align: left;
            }
            &.time-r {
              text-align: right;
            }
          }
          .progress-bar-wrapper {
            flex: 1;
          }
        }
        .operators {
          display: flex;
          align-items: center;
          .icon {
            flex: 1;
            color: $color-theme;
            &.disable {
              color: $color-theme-d;
            }
            i {
              font-size: 30px;
            }
          }
          .i-left {
            text-align: right;
          }
          .i-center {
            padding: 0 20px;
            text-align: center;
            i {
              font-size: 40px;
            }
          }
          .i-right {
            text-align: left
          }
          .icon-favorite {
            color: $color-sub-theme;
          }
        }
      }
      &.normal-enter-active, &.normal-leave-active {
        transition: all .6s;
        .top, .bottom {
          transition: all .6s cubic-bezier(0.45, 0, 0.55, 1);
        }
      }
      &.normal-enter-from, &.normal-leave-to {
        opacity: 0;
        .top {
          transform: translate3d(0, -100px, 0);
        }
        .bottom {
          transform: translate3d(0, 100px, 0)
        }
      }
    }
  }
</style>
