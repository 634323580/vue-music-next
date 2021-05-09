<template>
  <div class="progress-bar"
    @click="onClick"
  >
    <div class="bar-inner">
      <div
        class="progress"
        ref="progress"
        :style="progressStyle"
      >
      </div>
      <div
        class="progress-btn-wrapper"
        :style="btnStyle"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend.prevent="onTouchEnd"
      >
        <div class="progress-btn"></div>
      </div>
    </div>
  </div>
</template>
<script>
const progressBtnWidth = 16

export default {
  name: 'progress-bar',
  emits: ['progress-changing', 'progress-changed'],
  props: {
    // 当前进度百分比
    progress: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      // 进度条offset值
      offset: 0
    }
  },
  computed: {
    progressStyle() {
      return `width:${this.offset}px`
    },
    btnStyle() {
      return `transform: translate3d(${this.offset}px, 0, 0)`
    }
  },
  watch: {
    // 计算出播放进度
    progress(newProgress) {
      this.setOffset(newProgress)
    }
  },
  created() {
    // 缓存touch数据
    this.touch = {}
  },
  methods: {
    onTouchStart(e) {
      // 缓存第一次pageX
      this.touch.x1 = e.touches[0].pageX
      // 当前进度条width
      this.touch.beginWidth = this.$refs.progress.clientWidth
    },
    onTouchMove(e) {
      // 计算出第一次pageX和当前move pageX差值
      const delta = e.touches[0].pageX - this.touch.x1
      // 计算出移动后播放进度条的width
      const tempWidth = this.touch.beginWidth + delta
      // 歌曲进度条总长度
      const barWidth = this.$el.clientWidth - progressBtnWidth
      // 计算出当前播放进度百分比
      const progress = Math.min(1, Math.max(tempWidth / barWidth, 0))
      // 计算出offset
      this.offset = barWidth * progress
      this.$emit('progress-changing', progress)
    },
    onTouchEnd() {
      // 歌曲进度条总长度
      const barWidth = this.$el.clientWidth - progressBtnWidth
      // 计算出当前播放进度百分比
      const progress = this.$refs.progress.clientWidth / barWidth
      this.$emit('progress-changed', progress)
    },
    onClick(e) {
      const rect = this.$el.getBoundingClientRect()
      const offsetWidth = e.pageX - rect.left
      const barWidth = this.$el.clientWidth - progressBtnWidth
      const progress = offsetWidth / barWidth
      this.$emit('progress-changed', progress)
    },
    setOffset(progress) {
      const barWidth = this.$el.clientWidth - progressBtnWidth
      this.offset = barWidth * progress
    }
  }
}
</script>

<style lang="scss" scoped>
  .progress-bar {
    height: 30px;
    .bar-inner {
      position: relative;
      top: 13px;
      height: 4px;
      background: rgba(0, 0, 0, 0.3);
      .progress {
        position: absolute;
        height: 100%;
        background: $color-theme;
      }
      .progress-btn-wrapper {
        position: absolute;
        left: -8px;
        top: -13px;
        width: 30px;
        height: 30px;
        .progress-btn {
          position: relative;
          top: 7px;
          left: 7px;
          box-sizing: border-box;
          width: 16px;
          height: 16px;
          border: 3px solid $color-text;
          border-radius: 50%;
          background: $color-theme;
        }
      }
    }
  }
</style>
