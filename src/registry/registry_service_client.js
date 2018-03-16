const { Client } = require('../base');

const config = require('../../config.json').services.REGISTRY;

class RegistryrServiceClient extends Client {
  constructor(PORT) {
    super(config.TYPE, config.NAME, 'http');
  }

  async getService(type) {
      const result = await this.request('GET', `services/${type}`);
      return result;
  }
}