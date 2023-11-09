"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_errors_1 = __importDefault(require("http-errors"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const index_1 = __importDefault(require("./routes/index"));
const users_1 = __importDefault(require("./routes/users"));
const savings_1 = __importDefault(require("./routes/savings"));
const config_1 = require("./config");
require("./models/association");
const groups_1 = __importDefault(require("./routes/groups"));
const paymentRoute_1 = __importDefault(require("./routes/paymentRoute"));
const settingsRoute_1 = __importDefault(require("./routes/settingsRoute"));
require("./models/otpCleanJob");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // Allow requests from any origin
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use((0, cors_1.default)());
// view engine setup
app.set("views", path_1.default.join(__dirname, "../views"));
app.set("view engine", "ejs");
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
config_1.db.sync({})
    .then(() => {
    console.log("Database is connected");
})
    .catch((err) => {
    console.log(err);
});
// force:true
// alter:true
app.use("/", index_1.default);
app.use("/users", users_1.default);
app.use("/savings", savings_1.default);
app.use("/groups", groups_1.default);
app.use("/paystack", paymentRoute_1.default);
app.use("/setting", settingsRoute_1.default);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next((0, http_errors_1.default)(404));
});
// error handler
app.use(function (err, req, res, next) {
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
