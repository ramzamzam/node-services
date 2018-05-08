const Client = require('./base_service_client');
const config = require('../../config.json').services.COLLABORATION;


class CollaborationServiceClient extends Client {
  
  static type() { return config.TYPE }

  constructor(HOST) {
    console.log({HOST})
    super(config.TYPE, HOST)
  }

  async getDocs() {
    return await this.request('get', 'docs');
  }

  async getDoc(id) {
    return await this.request('get', `docs/${id}`);
  }

  async createDoc(name) {
    return await this.request('post', 'docs', null, {
      name
    });
  }
}

module.exports = CollaborationServiceClient;