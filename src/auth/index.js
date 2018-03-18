const BaseService = require('../base/base_service');

const config = require('../../config.json').services.AUTH;

class AuthService extends BaseService {

  constructor(PORT) {
    super({
      PORT: PORT,
      type: config.TYPE,
      serviceName: config.NAME
    });
    const routes = [
      {
        method: 'get',
        path: '/token',
        handler: this.getTokenHandler.bind(this)
      }
    ];
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