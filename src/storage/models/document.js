const Sequelize = require('sequelize');

let Document = null;
module.exports = (db) => {
  
  if (Document) return Document;

  Document = db.define('document', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    text: {
      type: Sequelize.TEXT,
      defaultValue: ''
    }
  });

  return Document;
}