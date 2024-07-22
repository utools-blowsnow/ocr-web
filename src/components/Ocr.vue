<script lang="ts">
import {defineComponent} from 'vue'
import Ocr from "@/libs/model/ocr"
import Ocrv4 from "@/libs/models/ocrv4.ts";

export default defineComponent({
  name: "Ocr",
  async mounted() {
    let ocr = new Ocr(Ocrv4)
    await ocr.init()
    await ocr.detect(document.getElementById("img") as HTMLImageElement)
  }
})
</script>

<template>
  <div>
    <img id="img" src="@/assets/ocr_test.png" alt="">
<!--    <img id="img2" src="@/assets/test2.png" alt="">-->
  </div>
</template>

<style scoped>

</style>
