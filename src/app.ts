import express, { Request, Response, NextFunction } from "express";
import createError, { HttpError } from "http-errors";
import path from "path";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import _ from "lodash";
import cors from "cors";
import logger from "morgan";
import indexRouter from "./routes/index";
import usersRouter from "./routes/users";
import savingsRouter from "./routes/savings";
import { db } from "./config";
import "./models/association";
import groupRouter from "./routes/groups";
import paymentRoute from "./routes/paymentRoute";
import settingsRoute from "./routes/settingsRoute";
import "./models/otpCleanJob";

dotenv.config();

const app = express();

app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // Allow requests from any origin
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(cors());
// view engine setup
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));

db.sync({})
  .then(() => {
    console.log("Database is connected");
  })
  .catch((err: HttpError) => {
    console.log(err);
  });

// force:true
// alter:true

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/savings", savingsRouter);
app.use("/groups", groupRouter);
app.use("/paystack", paymentRoute);
app.use("/setting", settingsRoute);

// catch 404 and forward to error handler
app.use(function (req: Request, res: Response, next: NextFunction) {
  next(createError(404));
});

// error handler
app.use(function (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
function next() {
  throw new Error("Function not implemented.");
}
