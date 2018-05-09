const BaseService = require('./base_service');
const config    = require('../../config.json');

const socketio = require('socket.io');


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
  },

  async delete(ctx) {
    const collabService = await this.getServiceClient(clients.COLLABORATION);
    const {id} = ctx.params;
    await collabService.deleteDoc(id);
    ctx.status = 200;
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

  listen(...args) {
    super.listen(...args);
    this.io = socketio(this.httpServer);
    this.addSocketSupport()
  }

  addSocketSupport() {
    this.docsio = this.io.of('/docs');
    this.docsio.on('connect', async (socket) => {
      
      const doc_id = socket.handshake.query.doc_id;
      console.log('CONNECTED: ', doc_id);

      const collabServiceClient = await this.getServiceClient(clients.COLLABORATION);
      const docsSocketCient = collabServiceClient.socketConnection(doc_id);
      
      console.log('CONNECTED: ', doc_id);
      // events from collab service
      docsSocketCient.on('change', (diff) => {
        socket.emit('change', diff);
      });

      docsSocketCient.on('user join', (user) => {
        socket.emit('user join', user);
      });

      docsSocketCient.on('lock', (data) => {
        socket.emit('lock', data);
      });

      docsSocketCient.on('unlock', () => {
        socket.emit('unlock');
      });

      docsSocketCient.on('user leave', (user) => {
        socket.emit('user leave', user)
      });

      
      // events from client
      socket.on('lock', (u) => {
        docsSocketCient.emit('lock', u)
      });

      socket.on('change', (diff) => {
        console.log('change', diff)
        docsSocketCient.emit('change', diff);
      });

      socket.on('unlock', () => {
        docsSocketCient.emit('unlock');
      });

      socket.on('disconnect', (user) => {
        docsSocketCient.close();
      });
    });
  }

}


module.exports = BFFEService;