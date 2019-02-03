const winston = require("winston");
const asyncLocalStorage = require("async-local-storage");
asyncLocalStorage.enable();

const uuid = require("uuid/v4");

const winstonLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.json(),
    transports: new winston.transports.Console(),
});

class LogWrapper {
    constructor(name) {
        this.name = name;
    }

    addProperties(properties) {
        const currentProperties = asyncLocalStorage.get("logProperties");
        asyncLocalStorage.set("logProperties", Object.assign(currentProperties, properties));
    } 

    getAllProperties(properties) {
		const requestProperties = asyncLocalStorage.get("logProperties");
		const time = Date.now();
		const allProperties = Object.assign({}, properties, { name: this.name, time, }, requestProperties);
		return allProperties;
	}

	log(level, message, properties) {
		const allProperties = this.getAllProperties(properties);
		winstonLogger[level](message, allProperties);
	}

	info(message, properties = {}) {
		this.log("info", message, properties);
	}

	debug(message, properties = {}) {
		this.log("debug", message, properties);
	}

	warn(message, properties = {}) {
		this.log("warn", message, properties);
	}

	error(message, properties = {}) {
		this.log("error", message, properties);
	}

	trace(message, properties = {}) {
		this.log("trace", message, properties);
	}
}

const loggingMiddleware = (name) => {
    const logger = new LogWrapper(name);
	return async(ctx, next) => {
		const requestId = uuid();
		const { method, path, } = ctx;
		const requestProperties = { requestId, };
		asyncLocalStorage.set("logProperties", requestProperties);

		logger.info("received request", { path, method, });
		await next();

		const status = ctx.status;
		logger.info("sending response", { status, path, });
	};
};

const errorLogger = new LogWrapper("Application Error");

const errorHandler = (error) => {
    const { message, stack, code, } = error;
    errorLogger.error(message, { stack, errorCode: code, });
};

module.exports = {
    logger: (name) => new LogWrapper(name),
    loggingMiddleware,
    errorHandler,
};