const Client = require('./base_service_client');

const config = require('../../config.json').services.REGISTRY;

class RegistryrServiceClient extends Client {
  static type() { return config.TYPE }

  constructor(HOST) {
    super(config.TYPE, HOST);
  }

  async register({type, host}) {
    return await this.request('POST', 'register/', {type, host});
  }

  async getServices(type) {
      const result = await this.request('GET', `services/${type}`);
      return result;
  }

  async getService(serviceConstructor) {
    const serviceConfig = await this.request('GET', `service/${serviceConstructor.type()}`);
    console.log({serviceConfig})
    return new serviceConstructor(serviceConfig.host);
  }
}

module.exports = RegistryrServiceClient;