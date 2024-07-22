<script lang="ts">
import {defineComponent} from 'vue'
import Ocr from "@/libs/model/ocr"
import Ocrv4 from "@/libs/models/ocrv4.ts";

export default defineComponent({
  name: "Ocr",
  data() {
    return {
      form: {
        modelName: "PP-OCRv4"
      },
      models: [],
      currentModelName: "",
      currentOcr: null
    }
  },
  async mounted() {
    this.models = []
    this.models.push(await import("@/libs/models/ocrv3.ts"))
    this.models.push(await import("@/libs/models/ocrv4.ts"))
  },
  methods:{
    async startOcr(){
      let startTime = new Date().getTime()
      if (this.currentOcr == null || this.currentOcr.ocrModelOptions.name !== this.form.modelName){
        this.currentOcr = new Ocr(this.models.find(model => model.default.name === this.form.modelName).default)
        await this.currentOcr.init()
      }
      let result = await this.currentOcr.detect(document.getElementById("img") as HTMLImageElement)
      console.log(result)
      console.log("耗时：" + (new Date().getTime() - startTime) + "ms")
    }
  }
})
</script>

<template>
  <div class="ocr-box">
<!--    左侧-->
    <div class="ocr-pic-box">
      <!--      图片框-->
      <div class="ocr-origin-pic">
        <img id="img" src="@/assets/ocr_test.png" alt="">
      </div>
      <!--      识别图片框-->
      <div class="ocr-det-pic"></div>
    </div>
    <div class="ocr-result-box">
<!--      模型选择-->
      <div>
        <span>识别模型：</span>
        <el-select size="small" v-model="form.modelName">
          <el-option v-for="model in models" :key="model.default.name" :label="model.default.name" :value="model.default.name" />
        </el-select>
        <el-button @click="startOcr">开始</el-button>
        <div contenteditable="true"></div>
      </div>
<!--      识别结果框-->
    </div>
<!--    <img id="img2" src="@/assets/test2.png" alt="">-->
  </div>
</template>

<style scoped>
.ocr-box{
  display: flex;
  height: 100vh;
}
.ocr-pic-box{
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.ocr-result-box{
  flex: 1;
  background: rgb(244, 247, 255);
  padding: 20px;
}
</style>
