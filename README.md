# oop-tempr

Fetches temprs for the device associated with an authenticated message.

## Fields the tempr has access to

```javascript
{
    uuid: 'add28426-8839-4c41-b0fa-91b5d0720caa',
    message: {
        path: '/',
        query: {"q": "value"},
        method: 'GET',
        ip: '::ffff:127.0.0.1',
        body: {},
        headers: {
            host: 'localhost:3000',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:68.0) Gecko/20100101 Firefox/68.0',
            accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'accept-language': 'en-US,en;q=0.5',
            'accept-encoding': 'gzip, deflate',
            dnt: '1',
            connection: 'keep-alive',
            'upgrade-insecure-requests': '1',
            'cache-control': 'max-age=0'
        },
        hostname: 'localhost',
        protocol: 'http'
    },
    device: {
        id: 5,
        hostname: 'customer.oop.example',
        authentication: { path: '/' }
    },
    tempr: {
        endpointType: 'http',
        deviceId: '5',
        deviceTemprId: 1,
        queueResponse: true,
        template: {
            host: 'localhost',
            port: 443,
            path: '/test/path/here',
            requestMethod: 'POST',
            headers: [],
            body: '{"message": "here"}',
            protocol: 'https'
        }
    }
}
```


# License

Copyright (C) 2019 Blue Frontier IT Ltd

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
