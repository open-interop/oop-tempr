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

function queueTemprs(broker, config, temprs, layers, data) {
    if (!(temprs instanceof Array)) {
        temprs = [temprs];
    }

    for (const tempr of temprs) {
        const toForward = { ...data };
        toForward.tempr = tempr;
        toForward.layers = layers;

        broker.publish(config.exchangeName, config.temprOutputQ, toForward);
    }
}

module.exports = (broker, config, logger) => {
    const consumeMessage = function(message) {
        const data = message.content;
        const currentTime = new Date().getTime();

        logger.info(`Getting temprs for ${data.uuid}`);

        let temprUrl;

        if (data.tempr) {
            temprUrl = data.tempr.temprUrl;
        } else if (data.device) {
            temprUrl = data.device.temprUrl || data.device.tempr_url;
        } else if (data.schedule) {
            temprUrl = data.schedule.temprUrl || data.schedule.tempr_url;
        } else {
            throw new Error("No tempr source available");
        }

        if (cachedTemprs[temprUrl]) {
            var temprs = cachedTemprs[temprUrl];

            if (currentTime < temprs.expires) {
                queueTemprs(broker, config, temprs.data, temprs.layers, data);
                return;
            }
        }

        return makeRequest(temprUrl, config).then(function(json) {
            if (json.ttl) {
                json.expires = currentTime + json.ttl;
                cachedTemprs[temprUrl] = json;
            }

            queueTemprs(broker, config, json.data, json.layers, data);
        });
    };

    broker.consume(config.temprInputQ, consumeMessage);
};
