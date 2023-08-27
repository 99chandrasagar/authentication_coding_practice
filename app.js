const express = require("express");
const bcrypt = require("bcrypt");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userCheck = `
    select * from user
    where
        username = '${username}'`;
  const dbUser = await db.get(userCheck);
  //console.log(dbUser);
  if (dbUser === undefined) {
    if (password.length >= 5) {
      const createUserQUery = `
      insert into 
        user (username, name, password, gender, location)
      values
        (
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        );`;
      await db.run(createUserQUery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
  select * from user
  where
  username = '${username}'`;
  const dbUSer = await db.get(selectUserQuery);
  console.log(dbUSer);
  if (dbUSer === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUSer.password);
    if (isPasswordMatched) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userQuery = `
    select * from user
    where 
        username = '${username}';`;
  const dbUser = await db.get(userQuery);
  //console.log(dbUser);
  if (newPassword.length >= 5) {
    const ispasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (ispasswordMatched) {
      const hashpass = await bcrypt.hash(newPassword, 10);
      const query = `
        update user 
        set
            password = '${hashpass}'
            where username = '${username}';`;
      await db.run(query);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  } else {
    response.status(400);
    response.send("Password is too short");
  }
});

module.exports = app;
