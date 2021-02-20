const bunyan = require('bunyan');

const logger = bunyan.createLogger({
  name: 'sentinel',
  streams: [
    {
      level: 'info',
      stream: process.stdout, // eslint-disable-line
    },
    {
      level: 'error',
      path: './sentinel-error.log',
    },
  ],
});

module.exports = logger;
