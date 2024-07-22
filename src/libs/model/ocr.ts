import DetModel from "@/libs/model/detModel";
import RecModel from "@/libs/model/recModel";
import {InferenceSession, Tensor} from "onnxruntime-web";
import {imageDataToTensor, imageHtmlToData, previewImg} from "@/utils/imageHelper";
import {data2canvas, resizeNormImg, toPaddleInput} from "@/libs/model/modelUtils.ts";
import {ModelOptions, OcrModelOptions} from "@/libs/models/type.ts";

class Ocr{
    private ocrModelOptions: OcrModelOptions
    private det: DetModel;
    private rec: RecModel;

    constructor(ocrOptions: OcrModelOptions) {
        this.ocrModelOptions = ocrOptions
    }

    async init(options?: InferenceSession.SessionOptions) {
        this.det = new DetModel(this.ocrModelOptions.detModel.modelPath)
        this.rec = new RecModel(this.ocrModelOptions.recModel.modelPath, this.ocrModelOptions.charesPath)
        if (window['utools']){
            let detBuffer: ArrayBuffer | Buffer = window.mutils.readModelFile(this.ocrModelOptions.name + '_det.onnx')
            if (!detBuffer){
                detBuffer = await fetch(this.ocrModelOptions.detModel.modelPath).then(res => res.arrayBuffer());
                window.mutils.writeModelFile(this.ocrModelOptions.name + '_det.onnx', new Uint8Array(detBuffer))
            }
            let recBuffer: ArrayBuffer | Buffer = window.mutils.readModelFile(this.ocrModelOptions.name + '_rec.onnx')
            if (!recBuffer){
                recBuffer = await fetch(this.ocrModelOptions.recModel.modelPath).then(res => res.arrayBuffer());
                window.mutils.writeModelFile(this.ocrModelOptions.name + '_rec.onnx', new Uint8Array(recBuffer))
            }
            await this.det.init(new Uint8Array(detBuffer), options)
            await this.rec.init(new Uint8Array(recBuffer), options)
        }else{
            await this.det.init(null, options)
            await this.rec.init(null, options)
        }
    }

    async detect(img: HTMLImageElement, options?: InferenceSession.RunOptions) {
        const detResult = await this.det.predict(img, options);
        console.log('detResult', detResult);
        const promises = []
        let recResult = []
        for (let result of detResult.box) {
            // previewImg(result.img.data, result.img.width, result.img.height)
            let tensorData = await imageDataToTensor(result.img, 320, 48)
            recResult.push(await this.rec.predictTensor(tensorData).then(texts => {
                return {
                    text: texts,
                    box: result.box,
                    img: result.img
                }
            }))
        }
        // recResult = await Promise.all(promises)
        recResult = recResult.reverse()

        return recResult;
    }


    buildDetImage(img: HTMLImageElement, recResult) :string{
        const imgData = imageHtmlToData(img);
        let canvas = data2canvas(imgData);
        let ctx = canvas.getContext("2d")

        // 偏差值
        let mean = 0;
        for (const result of recResult) {
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

        let toCanvas = document.createElement("canvas")
        toCanvas.width = img.width
        toCanvas.height = img.height
        console.log('canvas', toCanvas.width, toCanvas.height)
        let newCtx = toCanvas.getContext("2d")
        newCtx.clearRect(0, 0, toCanvas.width, toCanvas.height)
        newCtx.drawImage(canvas, 0, 0)

        // 获取base64
        let base64 = toCanvas.toDataURL("image/png")
        return base64
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
