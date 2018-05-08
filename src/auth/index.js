const BaseService = require('../base/base_service');

const config = require('../../config.json').services.AUTH;
const redis = require('redis');


class AuthService extends BaseService {

  constructor(PORT, HOSTNAME) {
    super({
      PORT: PORT,
      type: config.TYPE,
      HOSTNAME: HOSTNAME,
      serviceName: config.NAME
    });
    const routes = [
      {
        method: 'get',
        path: '/token',
        handler: this.getTokenHandler.bind(this)
      }
    ];
    this.redisClient = redis.createClient(6379, 'redis');
    this.redisClient.set('test', 'OK');
    this.redisClient.get('test', (err, resp) => console.log(err, resp));

    this.addRoutes(routes);
  }

  async getTokenHandler(ctx) {
    const token = Math.random().toString(2);
    ctx.body = { token };
  }
}

module.exports = {
  Service: AuthService
};