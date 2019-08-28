const amqp = require("amqplib");
const fetch = require("node-fetch");
const config = require("./config");
const { logger } = require("./logger");

var cachedTemprs = {};

amqp.connect(config.amqpAddress)
    .then(conn => {
        return conn.createChannel().then(ch => {
            return ch.consume(config.translatedMessageQ, message => {
                const content = message.content.toString("utf8");
                const data = JSON.parse(content);

                if (!("message" in data && "device" in data)) {
                    logger.error(`Error in message, badly formatted?`);
                    ch.ack(message);
                    return;
                }

                logger.info(`Processing ${data.uuid}`);

                const device = data.device;

                var queueTemprs = (temprs, data) => {
                    for (const tempr of temprs) {
                        data.tempr = tempr;

                        const queueName = `${config.oopEndpointsQ}.${tempr.endpointType}`;
                        ch.publish(
                            config.endpointsExchangeName,
                            queueName,
                            Buffer.from(JSON.stringify(data))
                        );
                    }
                };

                if (device.id in cachedTemprs) {
                    var temprs = cachedTemprs[device.id];

                    if (new Date().getTime() < temprs.expires) {
                        queueTemprs(temprs.data, data);
                        ch.ack(message);

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
                    .then(() => ch.ack(message))
                    .catch(err => logger.error(err));
            });
        });
    })
    .catch(logger.error);
