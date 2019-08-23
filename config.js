const dotenv = require("dotenv");

dotenv.config();

module.exports = {
    amqpAddress: process.env.AMQP_ADDRESS,
    exchangeName: process.env.EXCHANGE_NAME,
    endpointsExchangeName: process.env.ENDPOINTS_EXCHANGE_NAME,
    translatedMessageQ: process.env.TRANSLATED_MESSAGE_Q,
    oopCoreApiUrl: process.env.OOP_CORE_API_URL,
    oopEndpointsQ: process.env.OOP_ENDPOINTS_Q,
    oopNoEndpointQ: process.env.OOP_NO_ENDPOINT_Q,
    oopCoreToken: process.env.OOP_CORE_TOKEN
};
