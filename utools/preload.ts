import logger from "./preload/logger";
const os = require('os');
const fs = require('fs');

window.mutils = {

    logger: logger,

    setLoggerListener(listener: Function) {
        logger.setListener(listener);
    },

    readModelFile(modelName) : Buffer{
        let tmpPath = os.tmpdir() + '/' + modelName
        if (fs.existsSync(tmpPath) === false){
            return null
        }
        console.log('readModelFile tmpPath', tmpPath);
        return fs.readFileSync(tmpPath)
    },
    writeModelFile(modelName, buffer){
        let tmpPath = os.tmpdir() + '/' + modelName
        console.log('writeModelFile tmpPath', tmpPath);
        fs.writeFileSync(tmpPath, buffer)
    }
}
