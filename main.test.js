import test from "ava";
import { fetchMock } from "fetch-mock";

const proxyrequire = require("proxyquire").noCallThru();

test("temprs get queued", t => {
    t.plan(2);

    return new Promise((resolve, reject) => {
        const data = {
            data: [
                {
                    id: 1,
                    deviceId: 1,
                    temprId: 3,
                    endpointType: "http",
                    queueResponse: true,
                    template: {
                        host: "first-forward-url.com",
                        port: 443,
                        path: "/forward/path",
                        requestMethod: "POST",
                        protocol: "https",
                        headers: [
                            {
                                "Content-Type": "application/json"
                            }
                        ],
                        body: "first template goes here"
                    },
                    createdAt: "2019-08-30T08:59:46.708Z",
                    updatedAt: "2019-08-30T08:59:46.708Z"
                },
                {
                    id: 2,
                    deviceId: 1,
                    temprId: 4,
                    endpointType: "http",
                    queueResponse: true,
                    template: {
                        host: "second-forward-url.com",
                        port: 443,
                        path: "/forward/path",
                        requestMethod: "POST",
                        protocol: "https",
                        headers: [
                            {
                                "Content-Type": "application/json"
                            }
                        ],
                        body: "second template goes here"
                    },
                    createdAt: "2019-08-30T08:59:46.708Z",
                    updatedAt: "2019-08-30T08:59:46.708Z"
                }
            ]
        };

        const sandbox = fetchMock.sandbox();
        const main = proxyrequire("./main", { "node-fetch": sandbox });
        sandbox.mock("*", JSON.stringify(data));

        const expectedPublishes = data.data.length;
        const publishedMessages = [];

        const broker = {
            consume: (queue, callback) => {
                callback({
                    content: {
                        uuid: "000000-0000-0000-00000000",
                        message: {},
                        device: {
                            id: 1,
                            temprUrl: "http://localhost/devices/1/temprs"
                        }
                    }
                });
            },
            publish: (exchange, queue, message) => {
                publishedMessages.push(message.tempr);

                if (publishedMessages.length === expectedPublishes) {
                    t.is(
                        sandbox.lastUrl(),
                        "http://localhost/devices/1/temprs"
                    );
                    t.deepEqual(publishedMessages, data.data);

                    resolve();
                }
            }
        };

        main(
            broker,
            {
                temprInputQ: "test",
                oopCoreApiUrl: "http://localhost",
                oopCoreToken: "foobar"
            },
            { info: () => {}, error: () => {} }
        );
    });
});

const testCaching = async (ttl, timeout) => {
    const published = [];
    let callback;
    const broker = {
        consume: (queue, consumer) => {
            callback = consumer;
        },
        publish: (exchange, queue, data) => {
            published.push(data);
        }
    };

    const data = { ttl, data: [{ id: 1 }] };

    const sandbox = fetchMock.sandbox();
    const main = proxyrequire("./main", { "node-fetch": sandbox });

    sandbox.mock("*", JSON.stringify(data));

    await main(
        broker,
        {
            temprInputQ: "test",
            oopCoreApiUrl: "http://localhost",
            oopCoreToken: "foobar"
        },
        { info: () => {}, warn: () => {}, error: () => {} }
    );

    await callback({
        content: {
            uuid: "000000-0000-0000-00000000",
            message: {},
            device: {
                id: 1,
                temprUrl: "http://localhost/devices/1/temprs"
            }
        }
    });

    await new Promise(resolve => setTimeout(resolve, timeout));

    await callback({
        content: {
            uuid: "000000-0000-0000-00000000",
            message: {},
            device: {
                id: 1,
                temprUrl: "http://localhost/devices/1/temprs"
            }
        }
    });

    await new Promise(resolve => setTimeout(resolve, 5));

    return { published, sandbox };
};

test("temprs get cached", async t => {
    t.plan(3);

    const { published, sandbox } = await testCaching(1000, 5);

    t.is(sandbox.calls().length, 1);
    t.is(sandbox.lastUrl(), "http://localhost/devices/1/temprs");
    t.is(published.length, 2);
});

test("temprs cache expires", async t => {
    t.plan(3);

    const { published, sandbox } = await testCaching(1, 20);

    t.is(sandbox.calls().length, 2);
    t.is(sandbox.lastUrl(), "http://localhost/devices/1/temprs");
    t.is(published.length, 2);
});

test("temprs cache string ttl works", async t => {
    t.plan(3);

    const { published, sandbox } = await testCaching("100", 1);

    t.is(sandbox.calls().length, 1);
    t.is(sandbox.lastUrl(), "http://localhost/devices/1/temprs");
    t.is(published.length, 2);
});

test("temprs cache string ttl times out", async t => {
    t.plan(3);

    const { published, sandbox } = await testCaching("100", 200);

    t.is(sandbox.calls().length, 2);
    t.is(sandbox.lastUrl(), "http://localhost/devices/1/temprs");
    t.is(published.length, 2);
});

test("temprs cache NaN ttl discarded", async t => {
    t.plan(3);

    const { published, sandbox } = await testCaching("whoops", 1);

    t.is(sandbox.calls().length, 2);
    t.is(sandbox.lastUrl(), "http://localhost/devices/1/temprs");
    t.is(published.length, 2);
});

test("no concurrent requests", t => {
    t.plan(1);

    return new Promise((resolve, reject) => {
        const sandbox = fetchMock.sandbox();
        const main = proxyrequire("./main", { "node-fetch": sandbox });
        const delay = new Promise(resolve => setTimeout(resolve, 500));
        sandbox.mock(
            "*",
            delay
                .then(() => t.is(sandbox.calls().length, 1))
                .then(resolve)
                .then(() => '{"ttl": 100, "data": []}')
        );

        const broker = {
            consume: (queue, _callback) => {
                for (let i = 0; i < 10; ++i) {
                    _callback({
                        content: {
                            uuid: "000000-0000-0000-00000000",
                            message: {},
                            device: {
                                id: 1,
                                temprUrl: "http://localhost/devices/1/temprs"
                            }
                        }
                    });
                }
            },
            publish: (exchange, queue, message) => {}
        };

        main(
            broker,
            {
                temprInputQ: "test",
                oopCoreApiUrl: "http://localhost",
                oopCoreToken: "foobar"
            },
            { info: () => {}, error: () => {} }
        );
    });
});

test("No tempr set gets discarded", t => {
    t.plan(1);

    const main = require("./main");

    return new Promise((resolve, reject) => {
        const broker = {
            consume: async (queue, _callback) => {
                await _callback({
                    content: {
                        uuid: "000000-0000-0000-00000000",
                        message: {}
                    }
                });

                t.pass();

                resolve();
            },
            publish: (exchange, queue, message) => {}
        };

        main(
            broker,
            {
                temprInputQ: "test",
                oopCoreApiUrl: "http://localhost",
                oopCoreToken: "foobar"
            },
            { info: () => {}, error: () => {} }
        );
    });
});
