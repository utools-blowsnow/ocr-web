import logger from "./preload/logger";
const os = require('os');
const fs = require('fs');

window.mutils = {

    logger: logger,

    setLoggerListener(listener: Function) {
        logger.setListener(listener);
    },
}
