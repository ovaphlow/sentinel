const bunyan = require('bunyan');

const logger = bunyan.createLogger({
  name: 'sentinel',
  streams: [
    {
      level: 'info',
      stream: process.stdout,
    },
    {
      level: 'error',
      path: './sentinel-error.log',
    },
  ],
});

module.exports = logger;
