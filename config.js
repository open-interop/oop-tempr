const dotenv = require("dotenv");

dotenv.config();

module.exports = {
    amqpAddress: process.env.OOP_AMQP_ADDRESS,
    exchangeName: process.env.OOP_EXCHANGE_NAME,
    endpointsExchangeName: process.env.OOP_ENDPOINTS_EXCHANGE_NAME,
    translatedMessageQ: process.env.OOP_HASAUTH_MESSAGE_Q,
    oopCoreApiUrl: process.env.OOP_CORE_API_URL,
    oopEndpointsQ: process.env.OOP_ENDPOINT_Q,
    oopNoEndpointQ: process.env.OOP_NO_ENDPOINT_Q,
    oopCoreToken: process.env.OOP_CORE_TOKEN
};
