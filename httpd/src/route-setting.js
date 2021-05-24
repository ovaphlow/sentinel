const Router = require('@koa/router');

const logger = require('./logger');
const { persistence } = require('./app');

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

/**
 * 注册
 * to-do: salt, jwt
 * to-do: 关联表数据初始化
 */
router.post('/user', async (ctx) => {
  try {
    let sql = `
        insert into
          setting (category, ref_id, ref_id2, name, json_doc)
          values ('用户', 0, 0, ?, ?)
        `;
    let [result] = await ctx.ps_cnx.execute(sql, [
      ctx.request.body.username,
      JSON.stringify({ password: ctx.request.body.password }),
    ]);
    sql = `
        select id, category, ref_id, ref_id2, name
        from setting
        where id = ?
        limit 1
        `;
    [result] = await ctx.ps_cnx.query(sql, [result.insertId]);
    ctx.response.body = result.length === 1 ? result[0] : '{}';
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
