const os = require('os');

const mysql = require('mysql2');

const config = require('./configuration');

const pool = mysql.createPool({
  user: config.persistence.user,
  password: config.persistence.password,
  host: config.persistence.host,
  port: config.persistence.port,
  database: config.persistence.database,
  waitForConnections: true,
  connectionLimit: os.cpus().length,
  queueLimit: os.cpus().length,
});

module.exports = pool;
