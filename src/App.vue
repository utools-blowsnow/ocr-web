<script lang="ts">
import VConsole from 'vconsole';
import Vue from 'vue'
import Ocr from "@/components/Ocr.vue";

let vConsole = null;

// 监听Ctrl + F12 打开调试
document.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.keyCode === 123) {
    if (vConsole == null){
      vConsole = new VConsole();
      vConsole.hideSwitch()
    }
    vConsole.show()
  }
});

export default {
  name: 'App',
  components: {Ocr},
  data() {
    return {
      /* 为el-tooltip设置content值 */
      tooltipContent: '',
      /* 为el-tooltip设置placement值 */
      tooltipPlacement: 'bottom'
    }
  },
  watch: {},
  methods: {

  }
}
</script>

<template>
  <div id="app">
    <ocr></ocr>
    <!-- 添加全局公用el-tooltip -->
    <el-tooltip  :placement="tooltipPlacement" ref="tooltip" :content="tooltipContent"></el-tooltip>
  </div>
</template>

<style scoped>
#app {
}
</style>


<style>

</style>
