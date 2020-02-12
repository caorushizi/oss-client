import { app } from "electron";
import { Sequelize } from "sequelize";
import path from "path";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(app.getPath("downloads"), "test.db")
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });
