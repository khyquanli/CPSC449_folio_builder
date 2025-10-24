const mysql = require("mysql2");
const express = require("express");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname))); // Serves your static files (like dashboard.html)
app.use(express.urlencoded({ extended: true }));

// MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "myuser",
  password: "mypassword123",
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
  res.sendFile(path.join(__dirname, "login.html"));
});

app.post("/login", (req, res) => {
  const { username, input_password } = req.body;

  db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Server error");
    }

    if (results.length === 0) {
      return res.status(401).send("User not found");
    }

    const user = results[0];

    bcrypt.compare(input_password, user.password, (err, match) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error checking password");
      }

      if (match) {
        console.log("Login successful:", username);
        res.redirect("/dashboard.html"); // Redirect to dashboard
      } else {
        res.status(401).send("Invalid password");
      }
    });
  });
});

app.post("/register", (req, res) => {
  const { username, email, input_password, confirm_password } = req.body;

  // Optional: check if passwords match
  if (input_password !== confirm_password) {
    return res.status(400).send("Passwords do not match");
  }

  bcrypt.hash(input_password, 10, (err, hashedPassword) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error hashing password");
    }

    db.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username,email,hashedPassword], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Database error");
      }

      console.log("User registered:", username);
      res.redirect("/dashboard.html");
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});