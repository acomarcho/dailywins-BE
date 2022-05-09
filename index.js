const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('./pool');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

/* Initialize database */
const initializeDatabase = async () => {
  await pool.query(`
  CREATE TABLE IF NOT EXISTS users
    (id SERIAL,
    username TEXT,
    password TEXT);
  `)
  await pool.query(`
  CREATE TABLE IF NOT EXISTS todaywins
    (id SERIAL,
    username TEXT,
    date DATE,
    win TEXT)
  `);
  await pool.query(`
  CREATE TABLE IF NOT EXISTS tomorrowwins
    (id SERIAL,
    username TEXT,
    date DATE,
    win TEXT)
  `);
}

/* Routing for log in */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  /* Cek apakah ada user di database dengan username yang sama */
  const queryResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
  if (queryResult.rowCount == 0) {
    /* Username belum ada, gagal login */
    res.status(412).send({
      message: "Username not yet registered!"
    });
  } else {
    const { password: pwd } = queryResult.rows[0];
    bcrypt.compare(password, pwd, (err, result) => {
      if (result) {
        /* Login berhasil */
        /* Generate JWT */
        let token = jwt.sign({ username }, process.env.PRIVATE_KEY);
        res.send({
          message: `Successfully logged in as user ${username}!`,
          token
        });
      } else {
        res.status(412).send({
        message: "Wrong password!"
        });
      }
    })
  }
})

/* Routing for register */
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  /* Cek apakah ada user di database dengan username yang sama */
  const queryResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
  if (queryResult.rowCount == 0) {
    /* Username belum ada, lanjutkan registrasi */
    bcrypt.hash(password, 10, async (err, hash) => {
      await pool.query("INSERT INTO users (username, password) VALUES($1, $2);", [username, hash]);
      res.send({
        message: `Successfully registered user ${username} with the password ${password}.`
      })
    })
  } else {
    /* Username sudah ada, gagal registrasi */
    res.status(412).send({
      message: "Username already exists!"
    })
  }
})

/* Routing for validating user token user */
app.post("/user", (req, res) => {
  const { token } = req.body;
  /* Decode token */
  try {
    let decoded = jwt.verify(token, process.env.PRIVATE_KEY);
    res.send({
      username: decoded.username
    });
  } catch (err) {
    res.status(403).send({
      message: "Invalid authentication token!"
    });
  }
})

/* Routing for getting user's wins */
app.post("/getWins", async (req, res) => {
  const { token, date } = req.body;
  /* Decode token */
  try {
    let decoded = jwt.verify(token, process.env.PRIVATE_KEY);
    /* Token sudah ada, ambil username dari decoded */
    let username = decoded.username;
    /* Cari todaywins dari username */
    let todaywins = (await pool.query('SELECT * FROM todaywins WHERE username = $1 AND date = $2', [username, date])).rows;
    let tomorrowwins = (await pool.query('SELECT * FROM tomorrowwins WHERE username = $1 AND date = $2', [username, date])).rows;
    /* Kembalikan ke client */
    res.send({
      todaywins,
      tomorrowwins  
    });
  } catch (err) {
    res.status(403).send({
      message: "Invalid authentication token!",
    });
  }
})

/* Routing to add user's today win */
app.post("/todayWin", async (req, res) => {
  const { token, date, win } = req.body;
  /* Decode token */
  try {
    let decoded = jwt.verify(token, process.env.PRIVATE_KEY);
    /* Token sudah ada, ambil username dari decoded */
    let username = decoded.username;
    /* Masukkan today win sesuai data yang ada */
    let query = await pool.query('INSERT INTO todaywins (username, date, win) VALUES ($1, $2, $3) RETURNING *;', [username, date, win]);
    res.send({
      message: query.rows[0]
    });
  } catch (err) {
    res.status(403).send({
      message: "Invalid authentication token!",
    });
  }
})

/* Routing for deleting user's today win */
app.delete("/todayWin", async (req, res) => {
  const { token, id } = req.body;
  console.log(token);
  console.log(id);
  /* Decode token */
  try {
    let decoded = jwt.verify(token, process.env.PRIVATE_KEY);
    /* Token sudah ada, ambil username dari decoded */
    let username = decoded.username;
    console.log(username);
    console.log(id);
    /* Masukkan today win sesuai data yang ada */
    let query = await pool.query(
      "DELETE FROM todaywins WHERE username = $1 AND id = $2;",
      [username, id]
    );
    if (query.rowCount == 0) {
      res.status(403).send({
        message: "Forbidden delete request!",
      });
    } else {
      res.send({
        message: query.rows[0],
      });
    }
  } catch (err) {
    res.status(403).send({
      message: "Invalid authentication token!",
    });
  }
})

/* Routing to add user's tomorrow win */
app.post("/tomorrowWin", async (req, res) => {
  const { token, date, win } = req.body;
  /* Decode token */
  try {
    let decoded = jwt.verify(token, process.env.PRIVATE_KEY);
    /* Token sudah ada, ambil username dari decoded */
    let username = decoded.username;
    /* Masukkan tomorrow win sesuai data yang ada */
    let query = await pool.query('INSERT INTO tomorrowwins (username, date, win) VALUES ($1, $2, $3) RETURNING *;', [username, date, win]);
    res.send({
      message: query.rows[0]
    });
  } catch (err) {
    res.status(403).send({
      message: "Invalid authentication token!",
    });
  }
})

/* Routing for deleting user's tomorrow win */
app.delete("/tomorrowWin", async (req, res) => {
  const { token, id } = req.body;
  console.log(token);
  console.log(id);
  /* Decode token */
  try {
    let decoded = jwt.verify(token, process.env.PRIVATE_KEY);
    /* Token sudah ada, ambil username dari decoded */
    let username = decoded.username;
    console.log(username);
    console.log(id);
    /* Masukkan tomorrow win sesuai data yang ada */
    let query = await pool.query(
      "DELETE FROM tomorrowwins WHERE username = $1 AND id = $2;",
      [username, id]
    );
    if (query.rowCount == 0) {
      res.status(403).send({
        message: "Forbidden delete request!",
      });
    } else {
      res.send({
        message: query.rows[0],
      });
    }
  } catch (err) {
    res.status(403).send({
      message: "Invalid authentication token!",
    });
  }
})

app.listen(process.env.PORT || 3000, () => {
  initializeDatabase();
  console.log("Server is up and running!");
});