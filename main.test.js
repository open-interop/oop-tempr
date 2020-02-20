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

test("temprs get cached", t => {
    t.plan(3);

    return new Promise((resolve, reject) => {
        const data = {
            ttl: 10000,
            data: [
                {
                    id: 1,
                    deviceId: 1,
                    temprId: 3,
                    endpointType: "http",
                    queueResponse: true,
                    template: {
                        host: "forward-url.com",
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
                }
            ]
        };

        const sandbox = fetchMock.sandbox();
        const main = proxyrequire("./main", { "node-fetch": sandbox });
        sandbox.mock("*", JSON.stringify(data));

        let firstPublish = false;
        let callback;

        const broker = {
            consume: (queue, _callback) => {
                callback = _callback;

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
                if (firstPublish) {
                    t.is(sandbox.calls().length, 1);
                    t.is(
                        sandbox.lastUrl(),
                        "http://localhost/devices/1/temprs"
                    );
                    t.true(firstPublish.tempr === message.tempr);

                    resolve();
                } else {
                    firstPublish = message;

                    setTimeout(
                        () =>
                            callback({
                                content: {
                                    uuid: "000000-0000-0000-00000001",
                                    message: {},
                                    device: {
                                        id: 1,
                                        temprUrl:
                                            "http://localhost/devices/1/temprs"
                                    }
                                }
                            }),
                        1
                    );
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

test("temprs cache expires", t => {
    t.plan(3);

    return new Promise((resolve, reject) => {
        const data = {
            ttl: 5,
            data: [
                {
                    id: 1,
                    deviceId: 1,
                    temprId: 3,
                    endpointType: "http",
                    queueResponse: true,
                    template: {
                        host: "forward-url.com",
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
                }
            ]
        };

        const sandbox = fetchMock.sandbox();
        const main = proxyrequire("./main", { "node-fetch": sandbox });
        sandbox.mock("*", JSON.stringify(data));

        let firstPublish = false;
        let callback;

        const broker = {
            consume: (queue, _callback) => {
                callback = _callback;

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
                if (firstPublish) {
                    t.is(sandbox.calls().length, 2);
                    t.is(
                        sandbox.lastUrl(),
                        "http://localhost/devices/1/temprs"
                    );
                    t.false(firstPublish.tempr === message.tempr);

                    resolve();
                } else {
                    firstPublish = message;

                    setTimeout(
                        () =>
                            callback({
                                content: {
                                    uuid: "000000-0000-0000-00000001",
                                    message: {},
                                    device: {
                                        id: 1,
                                        temprUrl:
                                            "http://localhost/devices/1/temprs"
                                    }
                                }
                            }),
                        10
                    );
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

test("no concurrent requests", t => {
    t.plan(1);

    return new Promise((resolve, reject) => {
        const sandbox = fetchMock.sandbox();
        const main = proxyrequire("./main", { "node-fetch": sandbox });
        const delay = new Promise(resolve => setTimeout(resolve, 500));
        sandbox.mock(
            "*",
            delay.then(() => t.is(sandbox.calls().length, 1))
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
