import { Sequelize } from "sequelize";

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
          dialect: "postgres",
          logging: process.env.NODE_ENV === "development" ? console.log : false,
          dialectOptions: {
              ssl: {
                  require: true,
                  rejectUnauthorized: false,
              },
          },
      })
    : new Sequelize({
          dialect: "sqlite",
          storage: "./database.sqlite",
          logging: process.env.NODE_ENV === "development" ? console.log : false,
      });

const connectDatabase = async () => {
    await sequelize.authenticate();
    const dialect = sequelize.getDialect();
    console.log(`✅ ${dialect.toUpperCase()} Database Connected`);

    if (process.env.DB_SYNC === "true") {
        await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
        console.log("✅ Database Synced");
    } else {
        console.log("⏩ Database sync skipped (set DB_SYNC=true to enable)");
    }
};

export { sequelize, connectDatabase as default };
