const dotenv = require("dotenv");

dotenv.config();

module.exports = {
    amqpAddress: process.env.OOP_AMQP_ADDRESS,
    exchangeName: process.env.OOP_EXCHANGE_NAME,
    temprInputQ: process.env.OOP_TEMPR_INPUT_Q,
    temprOutputQ: process.env.OOP_TEMPR_OUTPUT_Q,
    oopCoreApiUrl: process.env.OOP_CORE_API_URL,
    oopCoreToken: process.env.OOP_CORE_TOKEN
};
