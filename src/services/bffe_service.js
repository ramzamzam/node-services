const BaseService = require('./base_service');
const config    = require('../../config.json');

const clients = require('../clients');

const cors = require('koa2-cors');

const documentHandlers = {

  async list(ctx) {
    const collabService = await this.getServiceClient(clients.COLLABORATION);
    const docs = await collabService.getDocs();
    ctx.body = docs;
  },

  async create(ctx) {
    const collabService = await this.getServiceClient(clients.COLLABORATION);
    const { name } = ctx.request.body;
    const doc = await collabService.createDoc( name );
    ctx.body = doc;
  },

  async get(ctx) {
    const collabService = await this.getServiceClient(clients.COLLABORATION);
    const {id} = ctx.params;
    const doc = await collabService.getDoc( id );
    ctx.body = doc;
  }
}


class BFFEService extends BaseService {
  constructor(PORT, HOSTNAME) {
    super({
      PORT: PORT || config.PORT,
      type: config.TYPE,
      HOSTNAME: HOSTNAME,
      serviceName: config.NAME,
      middlewares: [
        cors()
      ]
    });

    this.addRouteHandlers('/docs', documentHandlers);
    this.db = null;
    this.init();
  }

}


module.exports = BFFEService;