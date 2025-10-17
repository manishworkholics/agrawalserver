const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'eapp',              // Database name
  'manish123',         // Username
  '59Hbt1g?7',  // Password
  {
    host: '137.59.55.234', // ← only the host here
    port: 3306,        // ← port is specified separately
    dialect: 'mysql',
    logging: false,
    timezone: '+05:30'  // force IST
  }
);

sequelize.authenticate()
  .then(() => {
    console.log('Connected to the MySQL (MariaDB) Database');
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

module.exports = sequelize;
