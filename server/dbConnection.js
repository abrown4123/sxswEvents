const pg = require('pg');

const dbConfig = {
  user: 'swswuser', // env var: PGUSER
  database: 'sxsw2018', // env var: PGDATABASE
  password: 'sxsw2018kitkat', // env var: PGPASSWORD process.env.PGPASSWORD
  max: 100 // max number of clients in the pool
};

function connectToPSQL() {
  const pool = new pg.Pool(dbConfig);
  pool.on('error', (error, client) => console.log('PG Error:', error));

  return new Promise((resolve, reject) => {
    pool.connect((err, client) => {
      console.log(err);
      if(err) return reject(err);
      console.log('Database Connected!');
      return resolve(client);
    });
  });
}

const connection = connectToPSQL();
module.exports = connection;
