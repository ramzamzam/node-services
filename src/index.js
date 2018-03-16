const services = {
  AUTH: require('./auth').Service,
  REGISTRY: require('./registry').Service,
  BASE: require('./base').Service
};

const clients = {
  AUTH: require('./auth').Client,
  REGISTRY: require('./registry').Client,
  BASE: require('./base').Client
};

module.exports = {services, clients};