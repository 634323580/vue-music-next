import { computed, ref } from 'vue'

export default function useShortcut(props, groupRef) {
  // 锚点高度
  const ANCHOR_HEIGHT = 18
  const scrollRef = ref(null)
  // 所有的锚点
  const shortcutList = computed(() => {
    return props.data.map(group => {
      return group.title
    })
  })
  const touch = {}

  // 手指按下
  function onShortCutTouchStart(e) {
    // 获取锚点索引
    const anchorIndex = parseInt(e.target.dataset.index)
    touch.y1 = e.touches[0].pageY
    touch.anchorIndex = anchorIndex

    scrollTo(anchorIndex)
  }

  // 手指移动
  function onShortCutTouchMove(e) {
    touch.y2 = e.touches[0].pageY
    // 向下取整
    const delta = (touch.y2 - touch.y1) / ANCHOR_HEIGHT | 0
    const anchorIndex = touch.anchorIndex + delta

    scrollTo(anchorIndex)
  }

  // 定位到对应锚点
  function scrollTo(index) {
    if (isNaN(index)) {
      return
    }
    index = Math.max(0, Math.min(shortcutList.value.length - 1, index))
    const targetEl = groupRef.value.children[index]
    const scroll = scrollRef.value.scroll
    scroll.scrollToElement(targetEl, 0)
  }

  return {
    shortcutList,
    scrollRef,
    onShortCutTouchStart,
    onShortCutTouchMove
  }
}
