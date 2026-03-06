<template>
  <div>
    <audio controls id="Myaudio" ref="audioPlayer" v-if="showPlayer">
      <source :src="playerFiles.url" type="audio/mpeg" />
      你的浏览器不支持 audio 元素。
    </audio>
    <!-- {{playerFiles.url}} -->
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  musicData: {
    type: Object,
    default: () => {},
  },
});

let showPlayer = ref(false);

let playerFiles = ref(props.musicData);
watch(
  () => props.musicData,
  (newValue) => {
    // console.log(newValue);
    showPlayer.value = false;
    playerFiles.value = newValue;
    setTimeout(() => {
      showPlayer.value = true;
    }, 3000);
  },
  { immediate: true }
);
</script>

<style lang="less" scoped>
#Myaudio {
  width: 100%;
  background-color: #f1f3f4;
}
</style>