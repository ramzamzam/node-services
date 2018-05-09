const _ = require('lodash');
const redis = require('redis');

const BaseService       = require('./base_service')
const BaseServiceClient = require('../clients').BASE;

const config            = require('../../config.json').services.REGISTRY;

const _storage = require('../storage');

const socketio = require('socket.io');

class Storage {
    constructor() {
        this.data = [];
    }

    save(serviceClient) {
        if(this.data.find(service => service.is(serviceClient))) return true; // return true if we already have this one
        this.data.push(serviceClient);
    }

    get(type) {
        return this.data.filter((e) => e.type === type).map(s => s.toJSON());
    }


    delete(service) {
        this.data.splice(this.data.indexOf(service), 1);
    }

    all() {
        return this.data;
    }
    
    random(type) {
        const all = this.get(type); 
        if(!all.length) return;
        return all[ _.random(all.length - 1) ];
    }
}
  

class RegistryService extends BaseService {

    constructor(PORT, HOSTNAME) {

        super({
            PORT: PORT || config.PORT,
            type: config.TYPE,
            HOSTNAME: HOSTNAME,
            serviceName: config.NAME,
            shouldNotRegisterSelf: true
        });

        const self = this;
        const routes = [
            {
                method: 'post', 
                path:   '/register',
                handler : this.registerService.bind(self) // TODO: find out another way to do this
            },
            {
                method: 'get',
                path: '/services',
                handler: this.getServices.bind(self)
            },
            {
                method: 'get',
                path: '/services/:type',
                handler: this.getServicesByType.bind(self)
            },
            {
                method: 'get',
                path: '/service/:type',
                handler: this.getServiceByType.bind(self)
            }
        ]


        this.storage = new Storage();
        this.addRoutes(routes);
        this.addMiddleWares([
            async (ctx, next) => {
                ctx.set('Access-Control-Allow-Origin', 'localhost');
                ctx.set('Access-Control-Allow-Credentials', false);
                ctx.set('Access-Control-Allow-Headera', 'Origin, Accept, Content-Type');
                next();
            }
        ]);

        this.redisSubClient = redis.createClient(6379, 'redis');

        this.redisSubClient.subscribe('new service');
        this.redisSubClient.on('message', (channel, message) => {
            
            console.log( 'REDIS ::', {channel, message});
            if (channel !== 'new service' ) return;
            const serviceConfig = {headers : JSON.parse(message), fromNotification: true};
            this.registerService(serviceConfig, true);
        });
        this.redisPubClient = this.redisSubClient.duplicate();
        this.init();
        
    }

    async registerService(ctx) {
        const { type, host } =  ctx.headers;
        const { fromNotification } = ctx;
        const newService = this.createServiceClient(type, host);
        
        const alreadyHad = this.storage.save(newService); 
        if (alreadyHad) return;

        if (!fromNotification) {
            console.log('PUBLISH TO REDIS')
            this.redisPubClient.publish('new service', JSON.stringify({type, host}));
        }
        this.notifyClients();
        ctx.stasus = 200;
        ctx.body = 'OK';
    }

    async getServices(ctx) {
        ctx.body = this.storage.all();
    }

    async getServicesByType(ctx) {
        const {type} = ctx.params;
        
        const services = this.storage.get(type);
        
        ctx.body = services;
    }

    async getServiceByType(ctx) {
        const {type} = ctx.params;
        const services = this.storage.get(type);
        if(services.length) {
            ctx.body = services[ _.random(services.length - 1) ];
            ctx.status = 200;
        } else {
            ctx.status = 404;
            ctx.body = `Services of  "${type}" are not available`;
        }
        
    }

    runHealthChecks() {
        setInterval(() => this.healthCheck(), config.HEALTHCHECK_INTERVAL);
    }

    async healthCheck() {
        const services = this.storage.all();
        services.forEach(async (service) => {
            
            try {
                // console.log('checking', service.toJSON())
                const status = await service.healthCheck();
            } catch(err) {
                console.log(err);
                this.storage.delete(service);
                this.notifyClients();
            }

        });
    }

    createServiceClient(type, host) {
        return new BaseServiceClient(type, host);
    }

    listen(...args) {
        super.listen(...args);
        this.io = socketio(this.httpServer);
        this.addSocketSupport()
        this.runHealthChecks();
    }

    notifyClients() {
        this.io.local.emit('servers',this.storage.all().map((s) => s.toJSON()));
    }

    addSocketSupport() {
        this.io.on('connection', (socket) => {
            console.log('SOCKET Connection');
            socket.emit('servers', this.storage.all().map((s) => s.toJSON()));
        });
    }

    async initialize() {
        try {
            this.db = await _storage.connect({sync: true})
        } catch (err) {
            console.log({err});
        }
    }
}

module.exports = RegistryService;