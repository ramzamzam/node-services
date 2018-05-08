const _ = require('lodash');

const Sequelize = require('sequelize');
const initModels = require('./models');


const defaultConfig = {
  dbname: 'postgres',
  user: 'postgres',
  pass: '1111',
  host: 'storage'
}

module.exports = {
  async connect(options = {}) {
    options = _.defaults(options, defaultConfig);
    
    const { dbname, user, pass, host } = options;

    const db = new Sequelize(dbname , user, pass, {
      host,
      dialect: 'postgres',
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      operatorsAliases: false
    });

    return await initModels(db, options.sync);
  }
}