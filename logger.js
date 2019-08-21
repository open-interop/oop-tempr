const winston = require("winston");

const consoleTransport = new winston.transports.Console();
const myWinstonOptions = {
    transports: [consoleTransport]
};

const logger = new winston.createLogger(myWinstonOptions);

const middleware = function(req, res, next) {
    logger.info(
        `${new Date()}: Recieved request ${req.hostname} ${req.url} from ${
            req.ip
        }.`
    );
    next();
};

module.exports = {
    logger: logger,
    loggerMiddleware: middleware
};
