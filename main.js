const fetch = require("node-fetch");

const cachedTemprs = { device: {}, schedule: {} };
const currentRequests = {};

const makeRequest = (url, config) => {
    if (!(url in currentRequests)) {
        currentRequests[url] = fetch(url, {
            headers: { "X-Core-Token": config.oopCoreToken }
        })
            .then(res => {
                setTimeout(() => {
                    delete currentRequests[url];
                }, 0);

                return res.json();
            });
    }

    return currentRequests[url];
};

module.exports = (broker, config, logger) => {
    broker.consume(config.temprInputQ, message => {
        const data = message.content;

        logger.info(`Getting temprs for ${data.uuid}`);

        let source;
        let type;

        if ("device" in data) {
            source = data.device;
            type = "device";
        } else {
            source = data.schedule;
            type = "schedule";
        }

        var queueTemprs = (temprs, data) => {
            for (const tempr of temprs) {
                const toForward = { ...data };
                toForward.tempr = tempr;

                broker.publish(
                    config.exchangeName,
                    config.temprOutputQ,
                    toForward
                );
            }
        };

        if (source.id in cachedTemprs[type]) {
            var temprs = cachedTemprs[type][source.id];

            if (new Date().getTime() < temprs.expires) {
                queueTemprs(temprs.data, data);
                return;
            }
        }

        makeRequest(source.temprUrl || source.tempr_url, config)
            .then(json => {
                queueTemprs(json.data, data);

                if (json.ttl) {
                    json.expires = new Date().getTime() + json.ttl;
                    cachedTemprs[type][source.id] = json;
                }
            })
            .catch(err => console.error(err));
    });
};
