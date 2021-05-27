import { ref } from 'vue'
import animations from 'create-keyframe-animation'
export default function useAnimation() {
  const cdWrapperRef = ref(null)
  let entering = false
  let leaving = false

  function enter(el, done) {
    if (leaving) {
      afterLeave()
    }
    entering = true
    const { x, y, scale } = getPosAndScale()

    const animation = {
      0: {
        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`
      },
      100: {
        transform: 'translate3d(0, 0, 0) scale(1)'
      }
    }
    animations.registerAnimation({
      name: 'move',
      animation,
      presets: {
        duration: 600,
        easing: 'cubic-bezier(0.45, 0, 0.55, 1)'
      }
    })
    animations.runAnimation(cdWrapperRef.value, 'move', done)
  }

  function afterEnter() {
    entering = false
    animations.unregisterAnimation('move')
    cdWrapperRef.value.style.animation = ''
  }

  function leave(el, done) {
    if (entering) {
      afterEnter()
    }
    leaving = true
    const { x, y, scale } = getPosAndScale()

    const cdWrapperEL = cdWrapperRef.value
    cdWrapperEL.style.transition = 'all .6s cubic-bezier(0.45, 0, 0.55, 1)'
    cdWrapperEL.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
    cdWrapperEL.addEventListener('transitionend', next)
    function next() {
      cdWrapperEL.removeEventListener('transitionend', next)
      done()
    }
  }

  function afterLeave() {
    leaving = false
    const cdWrapperEL = cdWrapperRef.value
    cdWrapperEL.style.transition = ''
    cdWrapperEL.style.transform = ''
  }

  function getPosAndScale() {
    // 小CD宽度
    const targetWidth = 40
    // 小CD圆心left
    const paddingLeft = 40
    // 小CD圆心bottom
    const paddingBottom = 30
    // 大cd top
    const paddingTop = 80
    // 大cd宽度
    const width = window.innerWidth * 0.8
    // X偏移值，使大CD处在和小cd一样的位置
    const x = -(window.innerWidth / 2 - paddingLeft)
    // Y偏移值，使大CD处在和小cd一样的位置
    const y = window.innerHeight - paddingTop - width / 2 - paddingBottom
    const scale = targetWidth / width

    return {
      x,
      y,
      scale
    }
  }

  return {
    cdWrapperRef,
    enter,
    afterEnter,
    leave,
    afterLeave
  }
}
