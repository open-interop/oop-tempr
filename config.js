const dotenv = require("dotenv");

dotenv.config();

module.exports = {
    amqpAddress: process.env.AMQP_ADDRESS,
    exchangeName: process.env.EXCHANGE_NAME,
    translatedMessageQ: process.env.TRANSLATED_MESSAGE_Q
};
