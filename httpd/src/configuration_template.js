/**
 * 配置文件模板
 * 第一次启动时会根据此文件内容生成配置文件
 */
const configuration = {
  persistence: {
    user: '',
    password: '',
    host: '',
    port: 3306,
    database: '',
  },
  secret_key: 'by-ovaphlow',
  title: 'iOUhFOipoj823joOIUo',
  ui: {
    directory: '../scarecrow/build',
  },
  ui_module: [
    // {
    //   title: '总览',
    //   directory: 'dashboard',
    //   path: '/dashboard',
    // },
  ],
};

module.exports = configuration;
