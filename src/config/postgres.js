import Sequelize from 'sequelize';

// Postgres connection
export default new Sequelize(
    process.env.POSTGRES_DB,
    process.env.POSTGRES_USER,
    process.env.POSTGRES_PASS,
    {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        dialect: 'postgres',
        pool: {
            max: 9,
            min: 0,
            idle: 10000,
        },
        define: {
            freezeTableName: true,
        },
        logging: false,
    },
);
