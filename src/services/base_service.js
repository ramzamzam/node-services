const http = require('http');
const _ = require('lodash');

const KoaRouter = require('koa-router');
const Koa       = require('koa');
const bodyParser = require('koa-bodyparser');


const request   = require('request-promise');

const config    = require('../../config.json');
const RegistryClient = require('../clients').REGISTRY;
const baseRoutes = [
    { 
        method : 'get', 
        path : '/isalive',
        handler: async (ctx) => {
            ctx.body = { alive: true };
        }
    }    
];

const baseMWares = [
    bodyParser(),
    async (ctx, next) => {
        console.log(ctx.req.url)
        console.log(ctx.request.body)
        await next();
    },

    async (ctx, next) => {
        try {
            await next();
        } catch(err) {
            console.log(err);
            throw err;
        }
    }
];


const METHODS = {
    'list'   : { method: 'get', append: '' },
    'get'    : { method: 'get', append: '/:id' },
    'create' : { method: 'post', append: '' },
    // 'update' : { method: 'put', append:'/:id' }
  }

class BaseService {
    /**
     * 
     * @param {Object} options
     * @param options.PORT
     * @param options.type
     * @param options.serviceName
     */
    constructor(options) {
        this.type = options.type || 'BASE';
        this.serviceName = options.serviceName || 'base-service'
        this.PORT = options.PORT || 3001;
        this.HOSTNAME = options.HOSTNAME || this.serviceName;
        this.shouldNotRegisterSelf = options.shouldNotRegisterSelf || false;
      
        if (!this.initialize) this.initialize  = () => {};

        this.app = new Koa();
        this.router = new KoaRouter();
        if (options.middlewares) this.addMiddleWares(options.middlewares);
        this.addMiddleWares(baseMWares);
        this.addRoutes(baseRoutes);
        this.config = config;
    }

    init() {
        this.app
        .use(this.router.routes())
        .use(this.router.allowedMethods());
    }

    addRoutes(routes) {
        routes.forEach((route) => {
            this.router[route.method](route.path, route.handler);
        })
    }

    addMiddleWares(mws) {
        mws.forEach((mw) => this.app.use(mw));
    }

    addRouteHandlers(baseRoute, handlers) {
        const routes = _.map(handlers, (handler, kind) => {
          const opts = METHODS[kind];
          console.log ({
            method  : opts.method,
            path    : baseRoute + opts.append,
            handler : handler.bind(this)
          });

          return {
            method  : opts.method,
            path    : baseRoute + opts.append,
            handler : handler.bind(this)
          }; 
        });
        this.addRoutes(routes);
      }

    listen() {
        this.httpServer = http.createServer(this.app.callback());

        this.httpServer.listen(this.PORT, () => {
            console.log(`${this.serviceName} listening on port ${this.PORT}`);
            this.registerSelf();
        });
    }

    async registerSelf() {
        if(this.shouldNotRegisterSelf) return;

        this.registryClient = new RegistryClient(this.config.REGISTRY_URI);
        
        try {
            const result = await this.registryClient.register({
                type: this.type,
                host: 'http://' + this.HOSTNAME + ':' + this.PORT
            });
            console.log('REGISTERED', result);
        } catch(err) {
            console.error(err);
            setTimeout(this.registerSelf.bind(this), 1000);
        }
    }

    async getServiceClient(serviceConstructor) {
        return await this.registryClient.getService(serviceConstructor);
    }


}

module.exports = BaseService;