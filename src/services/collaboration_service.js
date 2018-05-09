const _ = require('lodash');
const redis = require('redis');
const socketio = require('socket.io');

const Storage = require('../storage');

const Service = require('./base_service');

const config = require('../../config.json').services.COLLABORATION;


/**
 * REST endpoints
 */
const documentHandlers = {

  async list(ctx) { 
    const docs = await this.db.document.findAll({attributes: ['name', 'id']});
    // console.log('ret docs:', docs );
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
  },

  async delete(ctx) {
    const { id } = ctx.params;
    try {
      await this.db.document.destroy({where:{id}});
    } catch(err) {
      console.log(err);
    }
    ctx.status = 200;
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

    this.docsSockets = {};

    this.redisSubClient = redis.createClient(6379, 'redis');
    this.redisPubClient = this.redisSubClient.duplicate();
    // TODO: add notoficationg other services

  }

  async initialize() {
    this.db = await Storage.connect();
  }


  listen(...args) {
    super.listen(...args);
    this.io = socketio(this.httpServer);
    this.addSocketSupport()
  }

  addSocketSupport() {
    this.docsio = this.io.of('/docs');
    this.docsio.on('connect', async (socket) => {
      
      const doc_id = socket.handshake.query.doc_id;
      const room_name = `document_${doc_id}`

      socket.join(room_name);

      // events from client
      socket.on('lock', (u) => {
        socket.broadcast.to(room_name).emit('lock');
      });

      socket.on('change', (diff) => {
        socket.broadcast.to(room_name).emit('change', diff)
        this.db.document.update({text: diff.text}, {where: { id: doc_id }})
          .then(() => {})
          .catch(err => console.error(err));
      });

      socket.on('unlock', () => {
        socket.broadcast.to(room_name).emit('unlock');
      });

      socket.on('disconnect', (user) => {
        this.docsio.to(room_name).emit('user leave', user)
      });
      
      socket.broadcast.to(room_name).emit('user join', {id: _.random(1000)});
    });
  }

}


module.exports = CollaborationService;