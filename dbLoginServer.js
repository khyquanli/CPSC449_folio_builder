const mysql = require("mysql2");
const express = require("express");
const bcrypt = require("bcrypt");
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
      // res.send("Login successful! 🎉");
      console.log(`Login successful for: ${username}`);
      res.redirect("/index.html"); // Redirect to main page on success
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
  const { username, email, password } = req.body;

  // Check if email already associated with existing account
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      console.log(`Email ${email} already associated with an account.`);
      return res.send("Email already exists.");
    }
    // Check if username is already taken
    db.query("SELECT * FROM users WHERE username = ?", [username], (err, result) => {
      if (err) throw err;

      if (result.length > 0) {
        console.log(`Username ${username} already taken.`);
        return res.send("Username already taken.");
      }

      // Hash password before storing
      const saltRounds = 10;
      bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
          console.error(err);
        }

        // Insert new user into database if both available
        db.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hashedPassword], (err, result) => {
          if (err) throw err;
          console.log(`New user registered: ${username}`);
          // res.send("Registration successful! You can now log in.");
          res.redirect("/login.html"); // Redirect to sign-in page after successful registration
        });
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
