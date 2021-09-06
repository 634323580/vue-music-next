<template>
  <div
    ref="rootRef"
    class="suggest"
    v-loading:[loadingText]="loading"
    v-no-result:[noResultText]="noResult"
  >
    <ul class="suggest-list">
      <li
        class="suggest-item"
        v-if="singer"
        @click="selectSinger(singer)"
      >
        <div class="icon">
          <i class="icon-mine"></i>
        </div>
        <div class="name">
          <p class="text">{{ singer.name }}</p>
        </div>
      </li>
      <li
        class="suggest-item"
        v-for="song in songs"
        :key="song.id"
        @click="selectSong(song)"
      >
        <div class="icon">
          <i class="icon-music"></i>
        </div>
        <div class="name">
          <p class="text">
            {{song.singer}}-{{song.name}}
          </p>
        </div>
      </li>
      <div
        class="suggest-item"
        v-loading:[loadingText]="pullUpLoading"
      ></div>
    </ul>
  </div>
</template>

<script>
  import { ref, watch, computed, nextTick } from 'vue'
  import { search } from '@/service/search'
  import { processSongs } from '@/service/song'
  import usePullUpLoad from './use-pull-up-load'

  export default {
    name: 'suggest',
    props: {
      query: String,
      showSinger: {
        type: Boolean,
        default: true
      }
    },
    emits: ['select-song', 'select-singer'],
    setup(props, { emit }) {
      // 歌手
      const singer = ref(null)
      // 歌曲
      const songs = ref([])
      // 是否有更多
      const hasMore = ref(true)
      // 页码
      const page = ref(1)
      const loadingText = ref('')
      const noResultText = ref('抱歉，暂无搜索结果')
      const manualLoading = ref(false)

      // loading
      const loading = computed(() => {
        return !singer.value && !songs.value.length
      })

      // 无数据状态
      const noResult = computed(() => {
        return !singer.value && !songs.value.length && !hasMore.value
      })

      const pullUpLoading = computed(() => {
        return isPullUpLoad.value && hasMore.value
      })

      // 数据正在加载
      const preventPullUpLoad = computed(() => {
        return loading.value || manualLoading.value
      })

      const { isPullUpLoad, rootRef, scroll } = usePullUpLoad(searchMore, preventPullUpLoad)

      // 监听query变化
      watch(() => props.query, async (newQuery) => {
        if (!newQuery) {
          return
        }
        await searchFirst()
      })

      // 搜索
      async function searchFirst() {
        if (!props.query) {
          return
        }
        // 重置参数
        page.value = 1
        songs.value = []
        singer.value = null
        hasMore.value = true

        // 发起搜索请求
        const result = await search(props.query, page.value, props.showSinger)
        // 处理返回的songs,赋值url
        songs.value = await processSongs(result.songs)
        singer.value = result.singer
        hasMore.value = result.hasMore
        await nextTick()
        await makeItScrollable()
      }

      // 加载更多
      async function searchMore() {
        if (!hasMore.value || !props.query) {
          return
        }
        page.value++
        const result = await search(props.query, page.value, props.showSinger)
        songs.value = songs.value.concat(await processSongs(result.songs))
        hasMore.value = result.hasMore
        await nextTick()
        // 处理数据不够滚动的情况
        await makeItScrollable()
      }

      async function makeItScrollable() {
        // scroll.value.maxScrollY >= -1 说明不可滚动,容器高度大于内容高度
        if (scroll.value.maxScrollY >= -1) {
          manualLoading.value = true
          await searchMore()
          manualLoading.value = false
        }
      }

      function selectSong(song) {
        emit('select-song', song)
      }

      function selectSinger(singer) {
        emit('select-singer', singer)
      }

      return {
        singer,
        songs,
        loadingText,
        noResultText,
        loading,
        noResult,
        pullUpLoading,
        selectSong,
        selectSinger,
        // pullUpLoad
        rootRef
      }
    }
  }
</script>

<style lang="scss" scoped>
  .suggest {
    height: 100%;
    overflow: hidden;
    .suggest-list {
      padding: 0 30px;
      .suggest-item {
        display: flex;
        align-items: center;
        padding-bottom: 20px;
        .icon {
          flex: 0 0 30px;
          width: 30px;
          [class^="icon-"] {
            font-size: 14px;
            color: $color-text-d;
          }
        }
        .name {
          flex: 1;
          font-size: $font-size-medium;
          color: $color-text-d;
          overflow: hidden;
          .text {
            @include no-wrap();
          }
        }
      }
    }
  }
</style>
