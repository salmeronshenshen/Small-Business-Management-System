
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = async (req, res) => {
    try {
        const { fullname, username, password } = req.body;

        if (!fullname || !username || !password) {
            return res.status(400).json({
                message: "Please complete all fields."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters."
            });
        }

        const existingUser = db.prepare(
            "SELECT * FROM users WHERE username = ?"
        ).get(username);

        if (existingUser) {
            return res.status(400).json({
                message: "Username already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = db.prepare(`
            INSERT INTO users (fullname, username, password, role)
            VALUES (?, ?, ?, ?)
        `).run(fullname, username, hashedPassword, "Staff");

        res.status(201).json({
            message: "Account registered successfully!",
            user_id: result.lastInsertRowid
        });

    } catch (error) {
        res.status(500).json({
            message: "Registration failed."
        });
    }
};

// LOGIN
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Please enter your username and password."
            });
        }

        const user = db.prepare(
            "SELECT * FROM users WHERE username = ?"
        ).get(username);

        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET || "small-business-development-secret",
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful!",
            token,
            user: {
                user_id: user.user_id,
                fullname: user.fullname,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed."
        });
    }
};
