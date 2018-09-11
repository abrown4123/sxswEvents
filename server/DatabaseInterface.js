const pg = require('pg');
const logger = require('./utils/logger.js');

/**
 * @name connectToPSQL
 * @description connect to psql
 * @return {Promise} will resolve with db connection
 */
function connectToPSQL(config) {
  logger.debug('connecting to db');

  const pool = new pg.Pool(config);

  pool.on('error', (err, client) => {
    logger.error('PSQL pool error', err);
  });

  return new Promise(function (resolve, reject) {
    pool.connect((err, client) => {
      if(err) {
        logger.error('error fetching client from pool', err);
        return reject(err);
      }
      logger.info('Connected to database');
      return resolve(client);
    });
  });
}

let connection;

module.exports = {
  getConnection: () => {
    return connection;
  },

  startConnection: config => {
    if (connection) {
      logger.warning('Connection has already been started.');
      return connection;
    }

    connection = connectToPSQL(config);
    return connection;
  }
}
