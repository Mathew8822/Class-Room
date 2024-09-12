const router = require("express").Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
require("dotenv").config();
const axios = require("axios");
const bcrypt = require("bcryptjs");

console.log("JWT Secret:", process.env.JWT); // Check if JWT secret is loaded

const GITHUB_CLIENT_ID = process.env.CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.CLIENT_SECRET;

router.get("/githubLogin", (req, res) => {
  const gitHubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user`;
  res.redirect(gitHubAuthUrl);
  console.log(gitHubAuthUrl);
});

router.get("/callback", async (req, res) => {
  const code = req.query.code;
  console.log("CODE", code);
  if (!code) {
    return res.status(500).send({ error: "No code provided" });
  }

  try {
    const config = {
      method: "post",
      url: `https://github.com/login/oauth/access_token`,
      headers: {
        Accept: "application/json",
      },
      params: {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
      },
    };

    const tokenResponse = await axios.request(config);
    console.log("Token Response:", tokenResponse.data);
    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(500).send({ error: "No access token found" });
    }

    // Fetch user data from GitHub
    const userDataResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userData = userDataResponse.data;

    // Check if the instructor exists in your database
    let instructor = await prisma.instructor.findUnique({
      where: { username: userData.id.toString() },
    });
    console.log(instructor);

    // If the instructor does not exist, create a new instructor
    if (!instructor) {
      instructor = await prisma.instructor.create({
        data: {
          username: userData.id.toString(),
          password: userData.login,
        },
      });
    }

    res.redirect(`${process.env.FRONTEND_URL}?token=${accessToken}`);
  } catch (error) {
    console.log("Error:", error.response ? error.response.data : error.message);
    res.status(500).send({ error: "Something went wrong" });
  }
});

// Register a new instructor account
router.post("/register", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const instructor = await prisma.instructor.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    // Create a token with the instructor id
    const token = jwt.sign({ id: instructor.id }, process.env.JWT);

    res.status(201).send({ token });
  } catch (error) {
    next(error);
  }
});

// Login to an existing instructor account
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const instructor = await prisma.instructor.findUnique({
      where: { username },
    });

    if (!instructor) {
      return res.status(401).send("Invalid login credentials.");
    }

    // Compare hashed password with input password
    const passwordMatch = await bcrypt.compare(password, instructor.password);
    console.log("password:", password);
    console.log("Instructor Password:", instructor.password);

    if (!passwordMatch) {
      return res.status(402).send("Wrong login credentials.");
    }

    // Create a token with the instructor id
    const token = jwt.sign({ id: instructor.id }, process.env.JWT);

    res.send({ token });
  } catch (error) {
    next(error);
  }
});

// Get the currently logged in instructor
router.get("/me", async (req, res, next) => {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { id: req.user?.id },
    });

    res.send(instructor);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
