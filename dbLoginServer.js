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
  const { username, input_password } = req.body;
  console.log(username, input_password);

  db.query("SELECT * FROM users WHERE username = ?", [username], (err, result) => {
    if (err) throw err;

    if (result.length === 0) {
      console.log(`Login attempt failed: "${username}" not found`);
      return res.send("User not found. Please try again.");
    }

    const user = result[0]; // store instance of user from database

    bcrypt.compare(input_password, user.password, (err, isMatch) => {
      if (err) {
        console.error(err);
        // return res.send("An error occurred during authentication.");
      }
      if (isMatch) {
        console.log(`Login successful for: ${username}`);
        res.redirect("/index.html"); // Redirect to main page on success
      } else {
        console.log(`Login failed: Incorrect password for ${username}`);
        res.send("Invalid password. Please try again.");
      }
    });
  });
});

// Register page
app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/userRegister.html");
});

app.post("/register", (req, res) => {
  console.log(req.body)
  const { username, email, input_password } = req.body;

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

      if (req.body.input_password !== req.body.confirm_password) {
        console.log("Passwords do not match. Account not created.");
        return res.send("Passwords do not match. Please try again.");
      }

      // Hash password before storing
      const saltRounds = 10;
      bcrypt.hash(input_password, saltRounds, (err, hashed_password) => {
        if (err) {
          console.error(err);
        }

        // Insert new user into database if both available
        db.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hashed_password], (err, result) => {
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
