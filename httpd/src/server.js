const cluster = require('cluster');
const os = require('os');

const app = require('./app');
const logger = require('./logger');

const port = parseInt(process.argv[2]) || 34200;

if (cluster.isMaster) {
  logger.info(`主进程 PID:${process.pid}`); // eslint-disable-line

  for (let i = 0; i < os.cpus().length; i += 1) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    logger.info(
      `子进程 PID:${worker.process.pid}, 端口:${port}`, // eslint-disable-line
    );

    worker.on('message', (message) => {
      Object.keys(cluster.workers).forEach((id) => {
        cluster.workers[id].send(message);
      });
    });
  });

  cluster.on('exit', (worker, code, signal) => {
    logger.info(
      `子进程 PID:${worker.process.pid}终止，错误代码:${code}，信号:${signal}`, // eslint-disable-line
    );
    logger.info(`由主进程(PID:${process.pid})创建新的子进程`); // eslint-disable-line
    cluster.fork();
  });
} else {
  app.api_module = [];
  require('http').createServer(app.callback()).listen(port);
  process.on('message', (message) => {
    app.api_module.push(message);
  });
}
