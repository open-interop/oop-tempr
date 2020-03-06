const fetch = require("node-fetch");

const cachedTemprs = {};
const currentRequests = {};

function makeRequest(url, config) {
    if (!(url in currentRequests)) {
        currentRequests[url] = fetch(url, {
            headers: { "X-Core-Token": config.oopCoreToken }
        }).then(async res => {
            const json = await res.json();

            setTimeout(function() {
                delete currentRequests[url];
            }, 0);


            return json;
        });
    }

    return currentRequests[url];
}

function queueTemprs(broker, config, temprs, data) {
    for (const tempr of temprs) {
        const toForward = { ...data };
        toForward.tempr = tempr;

        broker.publish(config.exchangeName, config.temprOutputQ, toForward);
    }
}

module.exports = (broker, config, logger) => {
    const consumeMessage = function(message) {
        const data = message.content;
        const currentTime = new Date().getTime();

        logger.info(`Getting temprs for ${data.uuid}`);

        let source;

        if ("device" in data) {
            source = data.device;
        } else {
            source = data.schedule;
        }

        const temprUrl = source.temprUrl || source.tempr_url;

        if (cachedTemprs[temprUrl]) {
            var temprs = cachedTemprs[temprUrl];

            if (currentTime < temprs.expires) {
                queueTemprs(broker, config, temprs.data, data);
                return;
            }
        }

        return makeRequest(temprUrl, config)
            .then(function(json) {
                if (json.ttl) {
                    json.expires = currentTime + json.ttl;
                    cachedTemprs[temprUrl] = json;
                }

                queueTemprs(broker, config, json.data, data);
            });
    }

    broker.consume(config.temprInputQ, consumeMessage);
};
