require("dotenv").config();                    // <--- NEW: load .env

const mysql = require("mysql2");
const express = require("express");
const bcrypt = require("bcrypt");
const path = require("path");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
});


const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname))); // Serves your static files (like dashboard.html)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' })); // Allows frontend to send JSON with larger payload

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

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "userRegister.html"));
});

// Login Handler
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

// Registration Handler
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

    db.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hashed_password], (err, results) => {
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

      const userId = results.insertId;

      // Initialize empty setup checklist for new user
      db.query(
        "INSERT INTO user_checklist (user_id, checklist_state) VALUES (?, ?)",
        [userId, JSON.stringify({
          domain: false,
          template: false,
          project: false,
          resume: false,
          design: false
        })]
      );

      console.log("User registered:", username);
      res.redirect("/login")
    });
  });
});

app.get("/checkSession", (req, res) => {
  res.json({ loggedIn: !!req.session.user });
});

// Get user info for dashboard/profile menu
app.get("/getUserInfo", (req, res) => {
  if (!req.session.user) {
    return res.json({ loggedIn: false });
  }
  res.json({
    loggedIn: true,
    username: req.session.user.username,
    email: req.session.user.email,
  });
});

// Get user checklist from DB
app.get("/getChecklist", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  const userId = req.session.user.id;

  db.query(
    "SELECT checklist_state FROM user_checklist WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      return res.json(results[0].checklist_state);
    }
  );
});

// Save checklist updates
app.post("/saveChecklist", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  const userId = req.session.user.id;
  const updatedChecklist = req.body;

  db.query(
    "UPDATE user_checklist SET checklist_state = ? WHERE user_id = ?",
    [JSON.stringify(updatedChecklist), userId],
    err => {
      if (err) return res.status(500).json({ error: "Database error" });

      return res.json({ success: true });
    }
  );
});

// Logout Handler
app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Logout failed");
    }
    console.log("Logout successful")
    res.clearCookie("user_session");
    res.redirect("/"); // Redirect to login page after logout
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

// Portfolio Builder Routes
app.get("/create-portfolio", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "create-portfolio.html"));
});

// Save portfolio data (create new or update existing)
app.post("/api/save-portfolio", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const userId = req.session.user.id;
  const portfolioData = req.body;
  const portfolioId = portfolioData.id; // If updating existing portfolio
  const portfolioName = portfolioData.name || 'Untitled Portfolio';
  const templateName = portfolioData.template;

  // Only store components in JSON, not the entire portfolioData
  const componentsJson = JSON.stringify(portfolioData.components);

  // If portfolio has an ID, update it; otherwise create new
  if (portfolioId) {
    // Update existing portfolio
    db.query(
      "UPDATE portfolios SET name = ?, template = ?, components = ?, updated_at = NOW() WHERE id = ? AND user_id = ?",
      [portfolioName, templateName, componentsJson, portfolioId, userId],
      (err, result) => {
        if (err) {
          console.error("Error updating portfolio:", err);
          return res.status(500).json({ error: "Failed to save portfolio" });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Portfolio not found" });
        }
        res.json({ success: true, message: "Portfolio updated successfully", id: portfolioId });
      }
    );
  } else {
    // Insert new portfolio
    db.query(
      "INSERT INTO portfolios (user_id, name, template, components, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [userId, portfolioName, templateName, componentsJson],
      (err, result) => {
        if (err) {
          console.error("Error creating portfolio:", err);
          return res.status(500).json({ error: "Failed to save portfolio" });
        }
        res.json({ success: true, message: "Portfolio created successfully", id: result.insertId });
      }
    );
  }
});

// Get all user's portfolios
app.get("/api/portfolios", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const userId = req.session.user.id;

  db.query(
    "SELECT id, name, template, created_at, updated_at FROM portfolios WHERE user_id = ? ORDER BY updated_at DESC",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.json({ portfolios: results });
    }
  );
});

// Get single portfolio by ID
app.get("/api/portfolio/:id", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const userId = req.session.user.id;
  const portfolioId = req.params.id;

  db.query(
    "SELECT id, name, template, components FROM portfolios WHERE id = ? AND user_id = ?",
    [portfolioId, userId],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Portfolio not found" });
      }

      const portfolio = results[0];

      try {
        // Try to parse components JSON
        let components;
        if (typeof portfolio.components === 'string') {
          components = JSON.parse(portfolio.components);
        } else {
          components = portfolio.components;
        }

        res.json({
          id: portfolio.id,
          name: portfolio.name,
          template: portfolio.template,
          components: components
        });
      } catch (parseError) {
        console.error("Error parsing portfolio components:", parseError);
        console.error("Corrupted data:", portfolio.components);
        return res.status(500).json({
          error: "Portfolio data is corrupted. Please delete this portfolio and create a new one."
        });
      }
    }
  );
});

// Legacy endpoint - get first portfolio (for backwards compatibility)
app.get("/api/get-portfolio", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const userId = req.session.user.id;

  db.query(
    "SELECT id, name, template, components FROM portfolios WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length === 0) {
        return res.json({ hasPortfolio: false });
      }

      const portfolio = results[0];
      res.json({
        hasPortfolio: true,
        id: portfolio.id,
        name: portfolio.name,
        template: portfolio.template,
        components: JSON.parse(portfolio.components)
      });
    }
  );
});

// Delete a specific portfolio
app.delete("/api/portfolio/:id", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const userId = req.session.user.id;
  const portfolioId = req.params.id;

  db.query(
    "DELETE FROM portfolios WHERE id = ? AND user_id = ?",
    [portfolioId, userId],
    (err, result) => {
      if (err) {
        console.error("Error deleting portfolio:", err);
        return res.status(500).json({ error: "Failed to delete portfolio" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Portfolio not found" });
      }

      res.json({ success: true, message: "Portfolio deleted successfully" });
    }
  );
});

// Legacy endpoint - Delete all user's portfolios (deprecated, kept for backwards compatibility)
app.delete("/api/delete-portfolio", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const userId = req.session.user.id;

  db.query(
    "DELETE FROM portfolios WHERE user_id = ?",
    [userId],
    (err) => {
      if (err) {
        console.error("Error deleting portfolios:", err);
        return res.status(500).json({ error: "Failed to delete portfolios" });
      }
      res.json({ success: true, message: "All portfolios deleted successfully" });
    }
  );
});

// ===============================
// AI Text Assist Route
// ===============================
app.post("/api/ai/text-assist", async (req, res) => {
  try {
    // make sure user is logged in
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { text, mode, componentType, field } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required." });
    }

    const isGenerate = mode === "generate";

    const systemPrompt =
      "You help users write polished, professional content for their portfolio websites. " +
      "Write clearly, concisely, and in a friendly professional tone. " +
      "You rewrite or generate text for sections like About Me, Projects, Experience, etc.";

    const userPrompt = isGenerate
      ? `Using these notes, generate a polished portfolio section for "${componentType}.${field}":\n\n${text}`
      : `Rewrite the following portfolio text for "${componentType}.${field}" in a polished, friendly, professional tone. ` +
        `Keep the meaning but improve clarity and structure:\n\n"${text}"`;

    // Gemini likes a single prompt string, so combine them:
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const result = await geminiModel.generateContent(fullPrompt);
    const response = result.response;
    const newText = (response.text() || "Sorry, I couldn't generate text.").trim();

    res.json({ text: newText });
  } catch (err) {
    console.error("AI Error (Gemini):", err);
    res.status(500).json({ error: "AI service error" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});