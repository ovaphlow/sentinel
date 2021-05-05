const Router = require('@koa/router');

const logger = require('./logger');
const { persistence } = require('./app');

const router = new Router({
  prefix: '/api/setting',
});

module.exports = router;

router.all('/', async (ctx, next) => {
  logger.info('all methods');
  ctx.ps_cnx = persistence.promise();
  await next();
});

router.get('/', async (ctx) => {
  logger.info('get method');
  logger.info(ctx.ps_cnx);
  ctx.response.status = 200;
});
