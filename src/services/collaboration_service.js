const _ = require('lodash');

const Storage = require('../storage');

const Service = require('./base_service');

const config = require('../../config.json').services.COLLABORATION;


/**
 * REST endpoints
 */
const documentHandlers = {

  async list(ctx) { 
    const docs = await this.db.document.findAll({attributes: ['name', 'id']});
    console.log('ret docs:', docs );
    ctx.body = docs;
  },

  async create(ctx) {
    const { name } = ctx.request.body;
    const newDoc = await this.db.document.create({ name });
    ctx.body = newDoc;    
  },

  async get(ctx) {
    const { id } = ctx.params;
    const doc = await this.db.document.findById(id);
    ctx.body = doc;
  }

}

class CollaborationService extends Service {
  constructor(PORT, HOSTNAME) {
    super({
      PORT: PORT || config.PORT,
      type: config.TYPE,
      HOSTNAME: HOSTNAME,
      serviceName: config.NAME,
    });

    this.addRouteHandlers('/docs', documentHandlers);
    this.db = null;
    this.init();    
  }

  async initialize() {
    this.db = await Storage.connect();
  }
}


module.exports = CollaborationService;