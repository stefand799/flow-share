import express, { Application } from "express";
import expressLayouts from "express-ejs-layouts";
import path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

const ejs = require("ejs");

import navRoutes from "./routes/nav-routes";

import authRoutes from "./routes/auth-routes";

import userRoutes from "./routes/user-routes";
import groupRoutes from "./routes/group-routes";
import groupMemberRoutes from "./routes/group-member-routes";
import taskRoutes from "./routes/task-routes";
import expenseRoutes from "./routes/expense-routes";
import contributionRoutes from "./routes/contribution-routes";

const app: Application = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

app.set("views", path.join(__dirname, "..", "view"));

app.set("view engine", "ejs");

app.use(expressLayouts);

app.set("layout", "layout");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.use(cookieParser());

app.use(express.static(path.join(__dirname, "..", "view")));

app.use("/", navRoutes);

app.use("/auth", authRoutes);

app.use("/api/user", userRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/group-member", groupMemberRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/contribution", contributionRoutes);

app.use((req, res) => {
  res.status(404).send(`
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/home">Go to Home</a>
    `);
});

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Server error:", err);
    res.status(500).send(`
        <h1>500 - Server Error</h1>
        <p>Something went wrong on our end.</p>
        <a href="/home">Go to Home</a>
    `);
  }
);

app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log("🚀 FlowShare Server Started");
  console.log("=".repeat(50));
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Port: ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log(`Login Page: http://localhost:${PORT}/login`);
  console.log("=".repeat(50));
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  process.exit(0);
});

export default app;
