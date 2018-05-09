const Client = require('./base_service_client');
const config = require('../../config.json').services.COLLABORATION;
const io = require('socket.io-client');

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

  async deleteDoc(id) {
    return await this.request('delete', `docs/${id}`);
  }


  socketConnection(doc_id) {
    return io(this.host + '/docs?doc_id=' + doc_id);
  }

}

module.exports = CollaborationServiceClient;