const oop = require("oop-node-common");

module.exports = new oop.Config({
    amqpAddress: "OOP_AMQP_ADDRESS",
    exchangeName: "OOP_EXCHANGE_NAME",
    temprInputQ: "OOP_TEMPR_INPUT_Q",
    temprOutputQ: "OOP_TEMPR_OUTPUT_Q",
    oopCoreApiUrl: "OOP_CORE_API_URL",
    oopCoreToken: "OOP_CORE_TOKEN"
});
