<template>
    <div class="video-player-placeholder">
        <video
            ref="videoRef"
            :src="src"
            :poster="poster"
            :width="width"
            :height="height"
            controls
            @play="onPlay"
            @pause="onPause"
        >
            您的浏览器不支持视频播放
        </video>
    </div>
</template>

<script setup lang="ts">
/**
 * @file components/video-player/index.vue
 * @description 视频播放器组件（简化版）
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { ref } from 'vue'

const props = defineProps({
    src: {
        type: String,
        required: true
    },
    width: {
        type: String,
        default: '100%'
    },
    height: {
        type: String,
        default: 'auto'
    },
    poster: {
        type: String,
        default: ''
    }
})

const videoRef = ref<HTMLVideoElement | null>(null)

const play = () => {
    videoRef.value?.play()
}

const pause = () => {
    videoRef.value?.pause()
}

const onPlay = (event: Event) => {
    console.log('视频播放', event)
}

const onPause = (event: Event) => {
    console.log('视频暂停', event)
}

defineExpose({
    play,
    pause
})
</script>

<style scoped>
.video-player-placeholder {
    width: 100%;
}
.video-player-placeholder video {
    max-width: 100%;
}
</style>
