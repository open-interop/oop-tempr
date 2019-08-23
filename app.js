const amqp = require("amqplib");
const fetch = require("node-fetch");
const config = require("./config");
const { logger } = require("./logger");

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
                fetch(`${config.oopCoreApiUrl}/devices/${device.id}/temprs`, {
                    headers: { "X-Core-Token": config.oopCoreToken }
                })
                    .then(res => {
                        return res.json();
                    })
                    .then(json => {
                        for (const tempr of json) {
                            data.tempr = tempr;
                            const queueName = `${config.oopEndpointsQ}.${tempr.endpointType}`;
                            ch.publish(
                                config.endpointsExchangeName,
                                queueName,
                                Buffer.from(JSON.stringify(data))
                            );
                        }
                    })
                    .catch(err => {
                        logger.error(err);
                    });

                ch.ack(message);
            });
        });
    })
    .catch(logger.error);
