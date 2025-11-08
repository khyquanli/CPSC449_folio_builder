const mysql = require("mysql2");
const express = require("express");
const bcrypt = require("bcrypt");
const path = require("path");
const session = require("express-session");  // To manage login sessions
const MySQLStore = require("express-mysql-session")(session); // Stores session

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname))); // Serves your static files (like dashboard.html)
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

const sessionStore = new MySQLStore({}, db.promise()); // links session to existing db connection

app.use(
  session({
    key: "user_session",
    secret: "secretkey",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2 }, // User will automatically be logged out after 2 hours
  })
);

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

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
        // Store user info in session
        req.session.user = { 
          id: user.id, 
          username: user.username, 
          email: user.email 
        };
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

  if (input_password !== confirm_password) {
    return res.status(400).send("Passwords do not match");
  }

  bcrypt.hash(input_password, 10, (err, hashed_password) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error hashing password");
    }

    db.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hashed_password], (err) => {
      if (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
          if (err.message.includes('username')) {
            return res.status(400).send("Username already taken");
          }
          if (err.message.includes('email')) {
            return res.status(400).send("Email already registered");
          }
        }
        return res.status(500).send("Database error");
      }

      console.log("User registered:", username);
    });
  });
});

// Get user info for dashboard/profile menu
app.get("/getUserInfo", (req, res) => {
  if (req.session.user) {
    res.json({
      loggedIn: true,
      username: req.session.user.username,
      email: req.session.user.email,
    });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Logout failed");
    }
    console.log("Logout successful")
    res.clearCookie("user_session");
  });
});

// Ensures user can only access dashboard if logged in
app.get("/dashboard.html", (req, res) => {
  if (!req.session.user) {
    // If no active session, redirect to login
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});