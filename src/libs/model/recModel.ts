import {InferenceSession, Tensor} from 'onnxruntime-web';
import {imageBufferDataToTensor, imageHtmlToTensor} from "@/utils/imageHelper";
import iconv from "iconv-lite";

export default  class RecModel{
    private modelPath: string;
    private session: InferenceSession;
    private chares: string[];
    private charesPath: string;


    constructor(modelPath: string, charesPath: string) {
        this.modelPath = modelPath
        this.charesPath = charesPath
    }

    async init(){
        this.session = await InferenceSession.create(this.modelPath);

        this.chares = await fetch(this.charesPath)
            .then(async res => {
                const buffer = await res.arrayBuffer()
                return iconv.decode(buffer, 'utf8');
            })
            .then(txt => txt.split("\n"));

        console.log('chares', this.chares);
    }


    decodeText(output) {
        const data = output
        // dims  1=>总数量 2=>每块的数量
        const predLen = data.dims[2]
        const line = []
        let ml = data.dims[0] - 1

        console.log(data.data.length, predLen * data.dims[1]);
        for (let l = 0; l < data.data.length; l += predLen * data.dims[1]) {
            const predsIdx = []
            const predsProb = []
            // 切成指定块数
            for (let i = l; i < l + predLen * data.dims[1]; i += predLen) {
                const tmpArr = data.data.slice(i, i + predLen);
                // 查找最可信的数据
                const tmpMax = tmpArr.reduce((a,b)=>Math.max(a, b), Number.NEGATIVE_INFINITY);
                // 找到对应 label的索引，然后去查找label表数据对应的字符
                const tmpIdx = tmpArr.indexOf(tmpMax);
                // console.log(tmpArr,tmpMax,tmpIdx );
                predsProb.push(tmpMax);
                predsIdx.push(tmpIdx);
            }
            console.log(predsIdx, predsProb);
            line[ml] = this.decode(this.chares, predsIdx, predsProb, true)
            ml--
        }
        return line
    }

    decode(dictionary: string[], textIndex: any[], textProb: any[], isRemoveDuplicate: boolean) {
        const ignoredTokens = [0]
        const charList = []
        const confList = []
        for (let idx = 0; idx < textIndex.length; idx++) {
            if (textIndex[idx] in ignoredTokens) {
                continue
            }
            if (isRemoveDuplicate) {
                if (idx > 0 && textIndex[idx - 1] === textIndex[idx]) {
                    continue
                }
            }
            charList.push(dictionary[textIndex[idx] - 1])
            if (textProb) {
                confList.push(textProb[idx])
            } else {
                confList.push(1)
            }
        }
        let text = ''
        let mean = 0
        if (charList.length) {
            text = charList.join('')
            let sum = 0
            confList.forEach((item) => {
                sum += item
            })
            mean = sum / confList.length
        }
        return { text, mean }
    }

    async predict(img: HTMLImageElement, options?: InferenceSession.RunOptions){
        // let dims = [1, 3, 48, 320]

        const imageTensor = await imageHtmlToTensor(img, 320, 48)

        return this.predictTensor(imageTensor, options)
    }

    async predictBuffer(img: Buffer, options?: InferenceSession.RunOptions, tensorOptions?: any){
        // let dims = [1, 3, 48, 320]

        const imageTensor = await imageBufferDataToTensor(img, {
            height: 320,
            width: 48,
            // format: 'RGBA',
            // tensorFormat: 'RGB',
            ...tensorOptions || {}
        })

        return this.predictTensor(imageTensor, options)
    }


    async predictTensor(imageTensor: Tensor, options?: InferenceSession.RunOptions){
        const params = {};
        params[this.session.inputNames[0]] = imageTensor;
        console.log("rec predict run" , params);

        let results = await this.session.run(params, options)
        let data = results[this.session.outputNames[0]];

        console.log("rec predict result",results);

        return this.decodeText(data)
    }
}
