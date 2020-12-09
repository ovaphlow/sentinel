const cluster = require('cluster');
const fs = require('fs');
const http = require('http');
const os = require('os');

const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const mount = require('koa-mount');
const serve = require('koa-static');

const config = require('./configuration');
const logger = require('./logger');

const app = new Koa();

app.env = 'production';

// app.use(
//   serve(`${__dirname}/../ui/build`, {
//     maxage: 1000 * 60 * 60 * 24 * 7,
//     gzip: true,
//   }),
// );

config.module.forEach((iter) => {
  if (fs.existsSync(`${__dirname}/../../${iter.directory}`)) {
    app.use(
      mount(
        iter.path,
        serve(`${__dirname}/../../${iter.directory}/ui/build/`, {
          maxage: 1000 * 60 * 60 * 24 * 7,
          gzip: true,
        }),
      ),
    );
    iter.enabled = true;
  } else {
    iter.enabled = false;
  }
});

app.use(
  bodyParser({
    jsonLimit: '8mb',
  }),
);

app.use(async (ctx, next) => {
  if (ctx.request.url.indexOf('/api/') !== 0) {
    next();
    return;
  }
  logger.info(`--> ${ctx.request.method} ${ctx.request.url}`);
  await next();
  logger.info(`<-- ${ctx.request.method} ${ctx.request.url}`);
});

config.module.forEach((iter) => {
  if (iter.enabled) {
    app.use(mount('/', require(`../../${iter.directory}/api/index`)));
  }
});

const router = new Router({
  prefix: '/api',
});

router.get('/info', async (ctx) => {
  ctx.response.body = config;
});

router.post('/sign-up', async (ctx) => {
  logger.info(ctx.request.body);
  ctx.response.status = 200;
});

router.post('/sign-in', async (ctx) => {
  logger.info(ctx.request.body);
  ctx.response.status = 200;
});

app.use(router.routes());
app.use(router.allowedMethods());

if (cluster.isMaster) {
  logger.info(`主进程 PID:${process.pid}`);

  for (let i = 0; i < (Math.round(os.cpus().length / 3) || 1); i += 1) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    logger.info(`子进程 PID:${worker.process.pid}, 端口:${config.port}`);
  });

  cluster.on('exit', (worker, code, signal) => {
    logger.info(
      `子进程 PID:${worker.process.pid}终止，错误代码:${code}，信号:${signal}`,
    );
    logger.info(`由主进程(PID:${process.pid})创建新的子进程`);
    cluster.fork();
  });
} else {
  http.createServer(app.callback()).listen(config.port);
}
