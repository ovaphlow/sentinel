const Router = require('@koa/router');

const logger = require('./logger');

const router = new Router({
  prefix: '/api/setting',
});

module.exports = router;

const SQL_CREATE = `
CREATE TABLE setting (
	id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	category VARCHAR(20) NOT NULL DEFAULT '' COLLATE 'utf8mb4_general_ci',
	ref_id INT(10) UNSIGNED NOT NULL DEFAULT '0',
	ref_id2 INT(10) UNSIGNED NOT NULL DEFAULT '0',
	name VARCHAR(50) NOT NULL DEFAULT '' COLLATE 'utf8mb4_general_ci',
	json_doc JSON NOT NULL,
	PRIMARY KEY (id) USING BTREE
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
AUTO_INCREMENT=21
;
`;

router.get('/token', async (ctx) => {
  const { UnsecuredJWT } = require('jose/jwt/unsecured');

  let jwt = new UnsecuredJWT({ id: 1123 }).encode();
  logger.info('jwt:', jwt);
  ctx.response.body = jwt;
});

router.get('/verify-token', async (ctx) => {
  const { UnsecuredJWT } = require('jose/jwt/unsecured');

  let token = ctx.request.query.token || '';
  logger.info('token:', token);

  let payload = UnsecuredJWT.decode(token, {});
  logger.info('payload:', payload);

  ctx.response.body = payload;
});

/**
 * 用户注册
 * to-do: jwt
 * to-do: 关联表数据初始化
 */
router.post('/user', async (ctx) => {
  const crypto = require('crypto');

  const { UnsecuredJWT } = require('jose/jwt/unsecured');

  try {
    let sql = `
        select count(*) as qty
        from setting
        where name = ?
          and category = '用户'
        `;
    let [result] = await ctx.ps_cnx.query(sql, [ctx.request.body.username]);
    if (result[0].qty > 0) {
      ctx.response.status = 409;
      return;
    }
    let salt = crypto.randomBytes(4).toString('hex');
    let hmac = crypto.createHmac('sha256', salt);
    hmac.update(ctx.request.body.password);
    let password_after_salt = hmac.digest('hex');
    sql = `
        insert into
          setting (category, ref_id, ref_id2, name, json_doc)
          values ('用户', 0, 0, ?, ?)
        `;
    [result] = await ctx.ps_cnx.execute(sql, [
      ctx.request.body.username,
      JSON.stringify({ password: password_after_salt, salt: salt }),
    ]);
    sql = `
        select id, category, ref_id, ref_id2, name
        from setting
        where id = ?
        limit 1
        `;
    [result] = await ctx.ps_cnx.query(sql, [result.insertId]);
    if (result.length === 1) {
      ctx.response.body = { jwt: new UnsecuredJWT({ ...result[0] }).encode() };
    } else {
      ctx.response.status = 401;
    }
  } catch (err) {
    logger.error(err.stack);
    ctx.response.status = 500;
  }
});

router.get('/', async (ctx) => {
  logger.info('get method');
  logger.info(ctx.ps_cnx);
  ctx.response.status = 200;
});
