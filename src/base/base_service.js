const KoaRouter = require('koa-router');
const Koa       = require('koa');
const request   = require('request-promise');

const config    = require('../../config.json');

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
    (ctx, next) => {
        console.log(ctx.req.url)
        next();
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
        this.shouldNotRegisterSelf = options.shouldNotRegisterSelf || false;

        this.app = new Koa();
        this.router = new KoaRouter();
        this.addMiddleWares(baseMWares);
        this.addRoutes(baseRoutes);
        this.app
            .use(this.router.routes())
            .use(this.router.allowedMethods());

        this.config = config;
    }

  
    addRoutes(routes) {
        routes.forEach((route) => {
            this.router[route.method](route.path, route.handler);
        })
    }

    addMiddleWares(mws) {
        mws.forEach((mw) => this.app.use(mw));
    }

    listen() {
        this.app.listen(this.PORT, () => {
            console.log(`${this.serviceName} listening on port ${this.PORT}`);
            this.registerSelf();
        });
    }

    async registerSelf() {
        if(this.shouldNotRegisterSelf) return;

        const options = {
            method: 'POST',
            uri: this.config.REGISTRY_URI + '/register',
            headers: {
                type: this.type,
                host: 'http://' + this.serviceName + ':' + this.PORT
            },
            json: true 
        };
        
        try {
            const result = await request(options);
            console.log('REGISTERED', result);
        } catch(err) {
            console.error(err);
            setTimeout(this.registerSelf.bind(this), 1000);
        }
    }
}

module.exports = BaseService;