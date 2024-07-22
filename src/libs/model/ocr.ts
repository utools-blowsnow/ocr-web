import DetModel from "@/libs/model/detModel";
import RecModel from "@/libs/model/recModel";
import {InferenceSession, Tensor} from "onnxruntime-web";
import {imageDataToTensor, imageHtmlToData, previewImg} from "@/utils/imageHelper";
import {data2canvas, resizeNormImg, toPaddleInput} from "@/libs/model/modelUtils.ts";
import {ModelOptions, OcrModelOptions} from "@/libs/models/type.ts";

class Ocr{
    private det: DetModel;
    private rec: RecModel;
    private ocrModelOptions: OcrModelOptions

    constructor(ocrOptions: OcrModelOptions) {
        this.ocrModelOptions = ocrOptions
        this.det = new DetModel(ocrOptions.detModel.modelPath)
        this.rec = new RecModel(ocrOptions.recModel.modelPath, ocrOptions.charesPath)
    }

    async init() {
        await this.det.init()
        await this.rec.init()
    }

    async detect(img: HTMLImageElement, options?: InferenceSession.RunOptions) {
        const detResult = await this.det.predict(img, options);

        console.log('detResult', detResult);
        const promises = []
        for (let result of detResult.box) {
            // previewImg(result.img.data, result.img.width, result.img.height)
            let tensorData = await imageDataToTensor(result.img, 320, 48)
            promises.push(this.rec.predictTensor(tensorData).then(texts => {
                return {
                    text: texts,
                    box: result.box,
                    img: result.img
                }
            }))
        }
        let recResult = await Promise.all(promises)
        recResult = recResult.reverse()

        return recResult;
    }


    buildDetCanvas(img: HTMLImageElement, detResult): HTMLCanvasElement{
        const imgData = imageHtmlToData(img);
        let canvas = data2canvas(imgData);
        let ctx = canvas.getContext("2d")

        // 偏差值
        let mean = 0;
        for (let result of detResult.box) {
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "red";
            // 左上
            ctx.moveTo(result.box[0][0] - mean, result.box[0][1] + mean);
            for (let i = 1; i < result.box.length; i++) {
                ctx.lineTo(result.box[i][0] - mean, result.box[i][1] + mean);
            }
            ctx.lineTo(result.box[0][0] - mean, result.box[0][1] + mean);
            ctx.stroke();
        }
        return canvas;
    }

    previewRecAndDet(img: HTMLImageElement, recResult){
        // 创建个和图片高宽一样的canvas
        let canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        let ctx = canvas.getContext("2d")
        // 根据 recResult 绘制 text 和  矩形
        for (let result of recResult) {
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "red";
            // 左上
            ctx.moveTo(result.box[0][0], result.box[0][1]);
            for (let i = 1; i < result.box.length; i++) {
                ctx.lineTo(result.box[i][0], result.box[i][1]);
            }
            ctx.lineTo(result.box[0][0], result.box[0][1]);
            ctx.stroke();
            // 计算文字大小，通过 ybottom - ytop
            let height = result.box[3][1] - result.box[0][1];
            // 解决文字高宽导致错位问题
            ctx.font = (height - 2) + "px Arial";
            ctx.fillStyle = "red";
            ctx.fillText(result.text[0].text, result.box[0][0], result.box[0][1]+ height / 2 + 7);
        }

        document.body.appendChild(canvas);
    }
}

export default Ocr
