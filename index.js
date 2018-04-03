const _ = require('lodash');

const {services} =  require('./src');
const services_config = require('./config.json');
const PORT = Number(process.argv.pop());
const HOSTNAME = process.argv.pop();
if(PORT !== PORT) throw new Error('Last arg should be port number');

const TYPE = process.argv.pop();

if ( !_.keys(services).includes(TYPE) ) throw new Error(`Service ${TYPE} not found!`);

service = new services[ TYPE ]( PORT );
service.listen();

