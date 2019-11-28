const oop = require("oop-node-common");
const config = require("./config");
const main = require("./main");

const MessageBroker = oop.MessageBroker;

process.on("unhandledRejection", error => {
    oop.logger.error(error);
    process.exit(1);
});

main(
    new MessageBroker(config.amqpAddress),
    config,
    oop.logger
);
