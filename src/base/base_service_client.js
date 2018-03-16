const requestp = require('request-promise');

class BaseServiceClient {

  constructor(type, host) {
    this.type = type
    this.host = host;
  }

  async healthCheck() {
    return this.request('GET', 'isalive');
  }

  request(method, path, headers, body) {
    return requestp({
      method: method,
      uri : this.host + '/' + path,
      headers : headers,
      body: body,
      json: (typeof body === 'object')
    });
  }
  
  toJSON() {
    return {
      type: this.type,
      host: this.host
    }
  }
}


module.exports = BaseServiceClient;