var util = require("util"),
    net = require("net"),
    EventEmitter = require("events").EventEmitter;

// Assumed Agent interface:
//   1) listen to socket's free event
//   2) Agent.prototype.addRequest = function (req, host, port) {}

/** @constructor */
function PoolAgent (options) {
  
  this.options = options || {};
  
  // maximum time that a socket can spend "available" before being closed
  this.availableTimeout = this.options.availableTimeout || 2500;
  
  // maximum number of open sockets per host-port pair
  this.maxSockets = this.options.maxSockets || 5;
  
  this.sockets = {}; 
  this.requests = {}; // queue of requests waiting to be serviced for a host-port pair
  this._socketsInUse = {}; // count of sockets in use for a host-port pair
  
}

PoolAgent.prototype.createConnection = function (name, host, port) {
  
  var poolAgent = this,
      socket = net.createConnection(port, host);
  
  if (this._socketsInUse.hasOwnProperty(name)) {
    this._socketsInUse[name] += 1;
  } else {
    this._socketsInUse[name] = 1;
  }
  
  function onFree () {
    var requests = poolAgent.requests[name];
    if (requests) {
      if (requests.length > 0) {
        requests.shift().onSocket(socket);
        if (requests.length === 0) {
          // there are no remaining waiting requests; clean up
          delete poolAgent.requests[name];
        }
      }
    } else {
      // Return the socket to the pool
      var socketPool = poolAgent.sockets[name];
      if (socketPool) {
        socketPool.push(socket);
      } else {
        // first socket in empty pool
        poolAgent.sockets[name] = [socket];
      }
      // After poolAgent.availableTimeout milliseconds spent "available", close the connection
      socket._poolagent_timeout = setTimeout(function () {
        socket.destroy();
      }, poolAgent.availableTimeout);
    }
    
  }
  socket.on("free", onFree);
  
  function onClose () {
    if (poolAgent._socketsInUse[name] === 1) {
      // last socket closed; clean up
      delete poolAgent._socketsInUse[name];
    } else {
      poolAgent._socketsInUse[name] -= 1;
    }
    // socket has been closed; clear timeout
    clearTimeout(socket._poolagent_timeout);
  }
  socket.on("close", onClose);
  
  function onAgentRemove () {
    // We need this function for cases like HTTP "upgrade"
    // (defined by WebSockets) where we need to remove a socket from the pool
    // because it'll be locked up indefinitely
    socket.removeListener("close", onClose);
    socket.removeListener("free", onFree);
    socket.removeListener("agentRemove", onAgentRemove);
    clearTimeout(socket._poolagent_timeout);
  }
  socket.on("agentRemove", onAgentRemove);
  
  return socket;
  
};

PoolAgent.prototype.addRequest = function (req, host, port) {
  
  var name = "_" + host + ":" + port,
      socketPool = this.sockets[name],
      socket;
  
  if (socketPool) {
    // sockets available
    socket = socketPool.shift();
    if (socketPool.length === 0) {
      // last socket used; clean up socket pool
      delete this.sockets[name];
    }
    // Socket has been allocated to a request; clear timeout
    clearTimeout(socket._poolagent_timeout);
    req.onSocket(socket);
  } else if ((this._socketsInUse[name] || 0) < this.maxSockets) {
    // no sockets available; create one if we haven't hit maxSockets
    socket = this.createConnection(name, host, port);
    req.onSocket(socket);
  } else {
    // no sockets available and we've hit maxSockets; queue up the request
    var requests = this.requests[name];
    if (requests) {
      requests.push(req);
    } else {
      this.requests[name] = [req];
    }
  }
  
};

exports.PoolAgent = PoolAgent;
