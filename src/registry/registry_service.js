const _ = require('lodash');

const BaseService       = require('../base').Service;
const BaseServiceClient = require('../base').Client;
const Storage           = require('./storage');
const config            = require('../../config.json').services.REGISTRY;

const socketio = require('socket.io');


class RegistryService extends BaseService {

    constructor(PORT) {

        super({
            PORT: PORT || config.PORT,
            type: 'REGISTRY',
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
        ])

    }   
    
    async registerService(ctx) {
        const { type, host } =  ctx.headers;
        const newService = this.createServiceClient(type, host);
        
        this.storage.save(newService);
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
                console.log('checking', service.toJSON())
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
}

module.exports = RegistryService;