const os = require('os');

const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const mysql = require('mysql2');

const logger = require('./logger');

let configuration = {};

/**
 * 初始化配置
 */
(() => {
  const fs = require('fs');

  const yaml = require('js-yaml');

  const configuration_template = require('./configuration_template');

  const conf_path = './configuration.yaml';

  const saveConfig = (config) => {
    fs.writeFileSync(conf_path, config, (err) => {
      if (err) {
        logger.error(`写入配置文件(${conf_path})失败`);
        logger.error(err.stack);
      }
    });
  };

  if (fs.existsSync(conf_path)) {
    configuration = yaml.load(fs.readFileSync(conf_path, 'utf8'));
  } else {
    logger.info(`首次运行`);
    const template = yaml.dump(configuration_template, { sortKeys: true });
    logger.info('读取配置文件模板');
    logger.info(template);
    saveConfig(template);
    logger.info(`生成配置文件 ${conf_path}`);
    logger.info('请编辑配置文件后再次运行');
    process.exit();
  }
})();

const persistence = mysql.createPool({
  user: configuration.persistence.user,
  password: configuration.persistence.password,
  host: configuration.persistence.host,
  port: configuration.persistence.port,
  database: configuration.persistence.database,
  waitForConnections: true,
  connectionLimit: os.cpus().length,
  queueLimit: os.cpus().length,
});

exports.persistence = persistence;

const app = new Koa();

app.env = 'production';

app.use(
  bodyParser({
    jsonLimit: '8mb',
  }),
);

app.use(async (ctx, next) => {
  logger.info(app.api_module, ctx.request.ip);
  for (let i = 0; i < app.api_module.length; i += 1) {
    const index = ctx.request.url.indexOf(app.api_module[i].path);
    if (index < 0) {
      continue;
    } else {
      const superagent = require('superagent');
      const path = [
        'http://',
        app.api_module[i].ip,
        ':',
        app.api_module[i].port,
        ctx.request.url,
      ];
      superagent
        .get(path.join(''))
        .then((response) => {
          logger.warn('rreess', response.body);
          ctx.response.status = 200;
        })
        .catch((err) => {
          logger.error(err);
          ctx.response.status = 500;
        });
      return;
    }
  }
  logger.info(`--> ${ctx.request.method} ${ctx.request.url}`);
  await next();
  logger.info(`<-- ${ctx.request.method} ${ctx.request.url}`);
});

const router = new Router({
  prefix: '/api',
});

router.get('/info', async (ctx) => {
  ctx.response.body = {
    title: config.title,
  };
});

router.get('/configuration', async (ctx) => {
  if (ctx.request.query.secret_key !== config.secret_key) {
    ctx.response.status = 403;
    return;
  }
});

router.post('/sentinel', async (ctx) => {
  const ip = ctx.request.ip.split(':');
  process.send({
    ip: ip[ip.length - 1],
    option: 'api_module',
    module: ctx.request.body.module_name,
    path: ctx.request.body.path_prefix,
    port: ctx.request.body.port,
  });
  ctx.response.body = configuration;
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

/*
router.put('/setting/list', async (ctx) => {
  try {
    const { category } = ctx.request.query || '';
    if (!category) {
      const offset = ctx.request.body.page || 0;
      const sql = `
          select id, origin_id, parent_id, category,
            json_doc->'$.name' as name,
            json_doc->'$.value' as value,
            json_doc->'$.remark' as remark
          from setting
          order by id desc
          limit ?, 30
          `;
      const cnx = persistence.promise();
      const [result] = await cnx.query(sql, [offset * 30]);
      ctx.response.body = result;
    } else if (category === 'filter') {
      const sql = `
          select id, origin_id, parent_id, category,
            json_doc->'$.name' as name,
            json_doc->'$.value' as value,
            json_doc->'$.remark' as remark
          from setting
          where category = ?
            and (
              position(? in json_doc->'$.name') > 0
              or position(? in json_doc->'$.value') > 0
            )
          limit 100
          `;
      const cnx = persistence.promise();
      const [result] = await cnx.query(sql, [
        ctx.request.body.category || '',
        ctx.request.body.keyword || '',
        ctx.request.body.keyword || '',
      ]);
      ctx.response.body = result;
    } else if (category === 'list-group') {
      const sql = `
          select category
          from setting
          group by category
          order by category
          `;
      const cnx = persistence.promise();
      const [result] = await cnx.query(sql);
      ctx.response.body = result;
    } else {
      ctx.response.body = [];
    }
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
    logger.info(ctx.request.body);
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
*/

app.use(router.routes());
app.use(router.allowedMethods());

// setting
(() => {
  const router = require('./route-setting');
  app.use(router.routes());
  app.use(router.allowedMethods());
})();

module.exports = app;
