import { ref, watch, computed, nextTick } from 'vue'

export default function useFixed(props) {
  // 固定标题的高度
  const TITLE_HEIGHT = 30
  const groupRef = ref(null)
  // 楼层据顶部距离
  const listHeight = ref([])
  // 当前滚动Y值
  const scrollY = ref(0)
  // 当前所处楼层index
  const currentIndex = ref(0)
  // 下一层距离顶部的距离
  const distance = ref(0)

  // 获取当前楼层字母标题
  const fixedTitle = computed(() => {
    if (scrollY.value < 0) {
      return ''
    }
    const currentGroup = props.data[currentIndex.value]
    return currentGroup ? currentGroup.title : ''
  })

  // 固定标题交互效果增强，往上推
  const fixedStyle = computed(() => {
    // 下一层距离顶部的距离
    const distanceVal = distance.value
    const diff = (distanceVal > 0 && distanceVal < TITLE_HEIGHT) ? distanceVal - TITLE_HEIGHT : 0
    return {
      transform: `translate3D(0, ${diff}px, 0)`
    }
  })

  watch(() => props.data, async () => {
    await nextTick()
    // 计算出每层楼距离顶部的距离
    calculate()
  })

  watch(scrollY, (newY) => {
    const listHeightVal = listHeight.value
    for (let i = 0; i < listHeightVal.length - 1; i++) {
      const heightTop = listHeightVal[i]
      const heightBottom = listHeightVal[i + 1]
      if (newY >= heightTop && newY <= heightBottom) {
        currentIndex.value = i
        // 下一层距离顶部的距离
        distance.value = heightBottom - newY
      }
    }
  })

  // 计算出每层楼距离顶部的距离
  function calculate() {
    // 每个楼层
    const list = groupRef.value.children
    const listHeightVal = listHeight.value
    let height = 0

    listHeightVal.length = 0
    listHeightVal.push(height)

    for (let i = 0; i < list.length; i++) {
      height += list[i].clientHeight
      listHeightVal.push(height)
    }
  }

  function onScroll(pos) {
    scrollY.value = -pos.y
  }

  return {
    groupRef,
    onScroll,
    fixedTitle,
    fixedStyle,
    currentIndex
  }
}
