const fetch = require("node-fetch");

var cachedTemprs = {};

module.exports = (broker, config, logger) => {
    broker.consume(config.temprInputQ, message => {
        const data = message.content;

        if (!("message" in data && "device" in data)) {
            logger.error(`Error in message, badly formatted?`);
            return;
        }

        logger.info(`Getting temprs for ${data.uuid}`);

        const device = data.device;

        var queueTemprs = (temprs, data) => {
            for (const tempr of temprs) {
                data.tempr = tempr;

                broker.publish(
                    config.exchangeName,
                    config.temprOutputQ,
                    data
                );
            }
        };

        if (device.id in cachedTemprs) {
            var temprs = cachedTemprs[device.id];

            if (new Date().getTime() < temprs.expires) {
                queueTemprs(temprs.data, data);
                return;
            }
        }

        fetch(`${config.oopCoreApiUrl}/devices/${device.id}/temprs`, {
            headers: { "X-Core-Token": config.oopCoreToken }
        })
            .then(res => res.json())
            .then(json => {
                queueTemprs(json.data, data);

                if (json.ttl) {
                    json.expires = new Date().getTime() + json.ttl;
                    cachedTemprs[device.id] = json;
                }
            })
            .catch(err => console.error(err));
    });
};
