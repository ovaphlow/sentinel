const cluster = require('cluster');
const fs = require('fs');
const http = require('http');
const os = require('os');

const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const mount = require('koa-mount');
const serve = require('koa-static');
const yaml = require('js-yaml');
const mysql = require('mysql2');

const configuration_template = require('./configuration_template');
const logger = require('./logger');
// const persistence = require('./persistence');

let config = {};

module.exports.config = config;

function saveConfig(conf_path, config) {
  fs.writeFile(conf_path, config, (err) => {
    logger.error(`写入配置文件(${conf_path})失败`);
    logger.error(err);
  });
}

// 配置文件
(() => {
  const conf_path = './configuration.yaml';
  if (fs.existsSync(conf_path)) {
    config = yaml.safeLoad(fs.readFileSync(conf_path, 'utf8'));
  } else {
    config = yaml.safeDump(configuration_template, { sortKeys: true });
    saveConfig(conf_path, config);
  }
})();

const persistence = mysql.createPool({
  user: config.persistence.user,
  password: config.persistence.password,
  host: config.persistence.host,
  port: config.persistence.port,
  database: config.persistence.database,
  waitForConnections: true,
  connectionLimit: os.cpus().length,
  queueLimit: os.cpus().length,
});

module.exports.persistence = persistence;

const app = new Koa();

app.env = 'production';

// app.use(
//   serve(`${__dirname}/../ui/build`, {
//     maxage: 1000 * 60 * 60 * 24 * 7,
//     gzip: true,
//   }),
// );

config.module.forEach((iter) => {
  // eslint-disable-next-line
  if (fs.existsSync(`${__dirname}/../../${iter.directory}`)) {
    app.use(
      mount(
        iter.path,
        // eslint-disable-next-line
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
  ctx.response.body = {
    title: config.title,
  };
});

// 注册
router.post('/sign-up', async (ctx) => {
  try {
    const sql = 'select count(*) as qty from staff where username = ?';
    const pool = persistence.promise();
    const [result] = await pool.query(sql, [ctx.request.body.username]);
    if (result[0].qty > 0) {
      ctx.response.status = 409;
      return;
    }
    const sql1 = 'insert into staff (username, json_doc) values (?, ?)';
    await pool.query(sql1, [
      ctx.request.body.username,
      JSON.stringify({ password: ctx.request.body.password }),
    ]);
    ctx.response.status = 200;
  } catch (err) {
    logger.error(`--> ${ctx.request.method} ${ctx.request.url} ${err}`);
    ctx.response.status = 500;
  }
});

router.post('/sign-in', async (ctx) => {
  try {
    const sql = `
    select id, username,
      json_doc->'$.password' as password
    from staff
    where username = ?
      and json_doc->'$.password' = ?
    `;
    const pool = persistence.promise();
    const [result] = await pool.query(sql, [
      ctx.request.body.username,
      ctx.request.body.password,
    ]);
    if (result.length === 0) {
      ctx.response.status = 404;
    } else if (result.length === 1) {
      ctx.response.body = {
        id: result[0].id,
        username: result[0].username,
      };
    } else {
      ctx.response.status = 403;
    }
  } catch (err) {
    logger.error(`--> ${ctx.request.method} ${ctx.request.url} ${err}`);
    ctx.response.status = 500;
  }
});

router.get('/setting/list', async (ctx) => {
  try {
    const { category } = ctx.request.query || '';
    if (!category) {
      ctx.response.body = [];
      return;
    }
    const sql = `
    select id, origin_id, parent_id, category,
      json_doc->'$.name' as name,
      json_doc->'$.value' as value,
      json_doc->'$.remark' as remark
    from setting
    where category = ?
    order by id desc
    limit 100
    `;
    const cnx = persistence.promise();
    const [result] = await cnx.query(sql, category);
    ctx.response.body = result;
  } catch (err) {
    logger.error(`--> ${ctx.request.method} ${ctx.request.url} ${err}`);
    ctx.response.status = 500;
  }
});

router.get('/setting/:id', async (ctx) => {
  try {
    const sql = `
    select id, origin_id, parent_id, category,
      json_doc->'$.name' as name,
      json_doc->'$.value' as value,
      json_doc->'$.remark' as remark
    from setting
    where id = ?
    `;
    const cnx = persistence.promise();
    const [result] = await cnx.query(sql, [parseInt(ctx.params.id, 10)]);
    ctx.response.body = result.length === 1 ? result[0] : {};
  } catch (err) {
    logger.error(`--> ${ctx.request.method} ${ctx.request.url} ${err}`);
    ctx.response.status = 500;
  }
});

router.put('/setting/:id', async (ctx) => {
  try {
    const sql = `
    update setting
    set origin_id = ?,
      parent_id = ?,
      category = ?,
      json_doc = ?
    where id = ?
    `;
    const cnx = persistence.promise();
    await cnx.query(sql, [
      parseInt(ctx.request.body.origin_id, 10),
      parseInt(ctx.request.body.parent_id, 10),
      ctx.request.body.category,
      JSON.stringify({
        name: ctx.request.body.name,
        value: ctx.request.body.value,
        remark: ctx.request.body.remark,
      }),
      parseInt(ctx.params.id, 10),
    ]);
    ctx.response.status = 200;
  } catch (err) {
    logger.error(`--> ${ctx.request.method} ${ctx.request.url} ${err}`);
    ctx.response.status = 500;
  }
});

router.delete('/setting/:id', async (ctx) => {
  try {
    const sql = 'delete from setting where id = ?';
    const cnx = persistence.promise();
    await cnx.query(sql, [parseInt(ctx.params.id, 10)]);
    ctx.response.status = 200;
  } catch (err) {
    logger.error(`--> ${ctx.request.method} ${ctx.request.url} ${err}`);
    ctx.response.status = 500;
  }
});

router.post('/setting', async (ctx) => {
  try {
    const sql = `
    insert into setting
      (origin_id, parent_id, category, json_doc)
    values
      (?, ?, ?, ?)
    `;
    const cnx = persistence.promise();
    await cnx.query(sql, [
      ctx.request.body.origin_id,
      ctx.request.body.parent_id,
      ctx.request.body.category,
      JSON.stringify({
        name: ctx.request.body.name,
        value: ctx.request.body.value,
        remark: ctx.request.body.remark,
      }),
    ]);
    ctx.response.status = 200;
  } catch (err) {
    logger.error(`--> ${ctx.request.method} ${ctx.request.url} ${err}`);
    ctx.response.status = 500;
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

if (cluster.isMaster) {
  logger.info(`主进程 PID:${process.pid}`); // eslint-disable-line

  for (let i = 0; i < (Math.round(os.cpus().length / 3) || 1); i += 1) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    logger.info(`子进程 PID:${worker.process.pid}, 端口:${config.port}`); // eslint-disable-line
  });

  cluster.on('exit', (worker, code, signal) => {
    logger.info(
      `子进程 PID:${worker.process.pid}终止，错误代码:${code}，信号:${signal}`, // eslint-disable-line
    );
    logger.info(`由主进程(PID:${process.pid})创建新的子进程`); // eslint-disable-line
    cluster.fork();
  });
} else {
  http.createServer(app.callback()).listen(config.port);
}
