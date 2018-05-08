const BaseService = require('./base').Service;
const redis = require('redis');


class RedisPubSub {
  constructor(pub, sub) {
    this.pub = pub;
    this.sub = sub;
    sub.subscribe('document change');
  }

  docChange(id, doc) {
    
  }

}

