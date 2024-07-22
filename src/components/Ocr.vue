<script lang="ts">
import {defineComponent} from 'vue'
import Ocr from "@/libs/model/ocr"
import {Loading} from "element-ui";

export default defineComponent({
  name: "Ocr",
  data() {
    return {
      form: {
        modelName: "PP-OCRv4",
      },
      picTab: "origin",

      models: [],
      currentOcr: null as Ocr | null,

      configDialogVisible: false,

      originImage: null,
      result: [],
      resultDetImage: null as string | null,
      resultText: ''
    }
  },
  async mounted() {
    this.models = []
    this.models.push(await import("@/libs/models/ocrv3.ts"))
    this.models.push(await import("@/libs/models/ocrv4.ts"))
  },
  methods:{
    async startOcr(){
      this.resultDetImage = null;
      this.result = []

      let startTime = new Date().getTime()
      let loading = this.$loading({
        lock: true,
        text: "开始识别...",
        spinner: "el-icon-loading",
        background: "rgba(0, 0, 0, 0.7)"
      })
      if (this.currentOcr == null || this.currentOcr.ocrModelOptions.name !== this.form.modelName){
        this.currentOcr = new Ocr(this.models.find(model => model.default.name === this.form.modelName).default)
        // 修改 loading 提示
        loading.setText("正在初始化模型...")
        await this.currentOcr.init({})
      }

      loading.setText("开始识别...")
      this.result = await this.currentOcr.detect(document.getElementById("img") as HTMLImageElement)
      console.log(this.result)
      loading.close()
      this.resultDetImage = this.currentOcr.buildDetImage(document.getElementById("img") as HTMLImageElement, this.result)
      this.picTab = "det"
      this.resultText = this.buildResultText();
      console.log("耗时：" + (new Date().getTime() - startTime) + "ms")
    },
    buildResultText(){
      if (this.result.length > 0){
        let text = ""
        for (let item of this.result){
          text += item.text[0].text + "\n"
        }
        return text
      }
      return ""
    },
    startScreenCapture(){
      utools.screenCapture(base64Str => {
        this.originImage = base64Str
        // 等待图片加载完毕
        let img = document.getElementById("img")
        // 监听图片的 load 事件
        img.addEventListener('load', () =>{
          this.startOcr()
          img.removeEventListener('load', () => {})
        });
      })
    },
    openConfigDialog(){
      this.configDialogVisible = true
    },
    selectFile(){
      let input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.onchange = (e) => {
        let file = (e.target as HTMLInputElement).files[0]
        let reader = new FileReader()
        reader.onload = (e) => {
          this.originImage = (e.target as FileReader).result as string
          this.startOcr()
        }
        reader.readAsDataURL(file)
      }
      input.click()
    }
  }
})
</script>

<template>
  <div class="ocr-box">
<!--    左侧-->
    <div class="ocr-pic-box">
      <el-tabs v-model="picTab">
        <el-tab-pane label="原图" name="origin"></el-tab-pane>
        <el-tab-pane label="识别图" name="det"></el-tab-pane>
      </el-tabs>
      <div class="ocr-pic-show-box">
        <!--      图片框-->
        <!--      识别图片框-->
        <div>
          <el-empty v-if="!originImage" description="请上传图片"></el-empty>
          <img v-show="picTab ==='origin' " id="img" :src="originImage" alt="">
          <img v-show="picTab ==='det' " :src="resultDetImage" alt="">
        </div>
      </div>
      <div class="footer-box">
        <div>正在使用本地OCR模型: {{form.modelName}}</div>
        <div>
          <el-button type="primary" icon="el-icon-picture-outline" @click="selectFile"
                     title="选择图片" circle></el-button>
          <el-button type="primary" icon="el-icon-crop" @click="startScreenCapture"
                     title="屏幕截图识别图片" circle></el-button>
        </div>
      </div>
    </div>
    <div class="ocr-result-box">
      <el-input type="textarea" class="ocr-result-content" resize="none"
        v-model="resultText">
      </el-input>
      <!--      识别结果框-->
      <div class="footer-box">
        <div>
          <i class="el-icon-setting" @click="openConfigDialog"></i>
        </div>
        <div>
          <el-button type="primary" size="small" icon="el-icon-copy-document">复制结果</el-button>
        </div>
      </div>
    </div>
    <el-dialog
        title="识别模型配置"
        :visible.sync="configDialogVisible">
      <el-form>
        <el-form-item label="识别模型">
          <el-select v-model="form.modelName">
            <el-option v-for="model in models" :key="model.default.name" :label="model.default.name" :value="model.default.name" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="configDialogVisible = false" type="primary">确定</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
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
  flex-direction: column;
}
.ocr-pic-show-box{
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.ocr-pic-box img{
  max-width: 100%;
  object-fit: contain;
}
.ocr-result-box{
  flex: 1;
  background: rgb(244, 247, 255);

  display: flex;
  flex-direction: column;
}
.ocr-result-content{
  flex: 1;
}
.footer-box{
  display: flex;
  width: 100%;
  height: 50px;
  border-top: 1px solid #bfbfbf;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
}
.ocr-pic-box .footer-box{
  border-top: none;
}
</style>
<style>
.ocr-result-content .el-textarea__inner{
  height: 100%;
  background: rgb(244, 247, 255);
  border: unset;
}
</style>
