// Override test DB credentials — allows tests to run against Docker Postgres
// (configent's getUserConfig() looks for [APP_NAME].config.js in cwd)
export default {
  sequelize: {
    username: 'hieronymus',
    password: 'hieronymus',
    database: 'hieronymus_test',
    host: '127.0.0.1',
    dialect: 'postgres',
    port: 5432,
    logging: false
  }
};