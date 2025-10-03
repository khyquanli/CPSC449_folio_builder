const mysql = require("mysql2");
const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname)));
app.use(express.urlencoded({ extended: true }));

// MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "myuser",
  password: "mypassword",
  database: "mydb"
});

db.connect(err => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to MySQL as ID " + db.threadId);
});

// Routes
app.get("/login", (req, res) => {
  console.log(req.headers);
  res.sendFile(__dirname + "/login.html");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);

  db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      console.log(`Login attempt failed: "${username}" not found`);
      return res.send("User not found.");
    }

    const user = results[0];

    if (password == user.password) {
      res.send("Login successful! 🎉");
      console.log(`Login successful for: ${username}`);
    } else {
      res.send("Invalid password.");
      console.log(`Login failed: Incorrect password for ${username}`);
    }
  });
});

// Register page
app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/userRegister.html");
});

app.post("/register", (req, res) => {
  console.log(req.body)
  const { username, password } = req.body;

  db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      return res.send("Username already exists!");
    }

    db.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], (err, results) => {
      if (err) throw err;
      console.log(`New user registered: ${username}`);
      res.send("Registration successful! You can now log in.");
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
