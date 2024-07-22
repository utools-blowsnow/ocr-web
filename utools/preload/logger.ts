class Logger {
    private listener: Function | null = null;

    show(level, ...msg) {
        console.log(`[${new Date().toLocaleString()}] [${level}]`, ...msg)
        if (this.listener) {
            this.listener(level, [`[${new Date().toLocaleString()}] [${level}]`, ...msg]);
        }
    }

    info(...msg) {
        this.show("INFO", ...msg)
    }

    error(...msg) {
        this.show("ERROR", ...msg)
    }

    warn(...msg) {
        this.show("WARN", ...msg)
    }

    debug(...msg) {
        this.show("DEBUG", ...msg)
    }

    trace(...msg) {
        this.show("TRACE", ...msg)
    }

    setListener(listener) {
        this.listener = listener;
    }
}


export default new Logger();
