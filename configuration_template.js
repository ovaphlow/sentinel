// 配置文件模板
const configuration = {
  port: 34200,
  secret_key: '72347u8',
  title: 'iOUhFOipoj823joOIUo',
  ui: {
    directory: '../scarecrow/build',
  },
  api_module: [
    {
      directory: 'logbook',
      enabled: true,
      path: '/logbook',
    },
  ],
  ui_module: [
    // {
    //   title: '总览',
    //   directory: 'dashboard',
    //   path: '/dashboard',
    // },
  ],
  persistence: {
    user: '',
    password: '',
    host: '',
    port: 3306,
    database: '',
  },
};

module.exports = configuration;
