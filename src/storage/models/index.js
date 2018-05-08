const _models = [
  'document'
];

module.exports = async (db, sync) => {

  const MODELS = {};

  for(const model of _models) {
    MODELS[model] = require(`./${model}`)(db);
  };

  if (sync) await db.sync();
  return MODELS;
}