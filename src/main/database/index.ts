import { app } from "electron";
import "reflect-metadata";
import { createConnection } from "typeorm";
import * as path from "path";
import { User } from "./entity/User";

createConnection({
  type: "sqlite",
  database: path.join(app.getPath("downloads"), "test.db"),
  key: "123"
})
  .then(async connection => {
    console.log("Inserting a new user into the database...");
    const user = new User();
    user.firstName = "Timber";
    user.lastName = "Saw";
    user.age = 25;
    await connection.manager.save(user);
    console.log(`Saved a new user with id: ${user.id}`);

    console.log("Loading users from the database...");
    const users = await connection.manager.find(User);
    console.log("Loaded users: ", users);

    console.log("Here you can setup and run express/koa/any other framework.");
  })
  .catch(error => console.log(error));
