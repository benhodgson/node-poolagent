# node-poolagent

node-poolagent is a socket-pooling
[HTTP agent](http://nodejs.org/api/http.html#http_class_http_agent) for
[Node.js](http://nodejs.org/) that keeps sockets open for a specified timeout.

## Example usage

```javascript
var http = require("http"),
    PoolAgent = require("./poolagent.js").PoolAgent;
    
var poolAgent = new PoolAgent({
      availableTimeout: 5000, // close sockets after they've been idle for 5000ms
      maxSockets: 10 // allow up to 5 concurrent open sockets per host-port pair
    }),
    httpRequestOptions = {
      hostname: "google.com",
      port: 80, path: "/",
      agent: poolAgent
    };

for (var i = 0; i < 100; i++) {
  http.get(httpRequestOptions, function (res) {
    // process response
  });
}
```

## TODO
  * add automated tests
  * test in recent versions of Node.js (last tested in v0.8.14)
  * allow the timeout to be set to zero to close socket immediately after
    response is received (this probably happens to behave as desired currently
    only due to the way that Node happens to handle events)

## Author
node-poolagent is written and maintained by [Ben Hodgson](http://benhodgson.com/).

## (Un)license

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute
this software, either in source code form or as a compiled binary, for any
purpose, commercial or non-commercial, and by any means.

In jurisdictions that recognize copyright laws, the author or authors of this
software dedicate any and all copyright interest in the software to the public
domain. We make this dedication for the benefit of the public at large and to
the detriment of our heirs and successors. We intend this dedication to be an
overt act of relinquishment in perpetuity of all present and future rights to
this software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
