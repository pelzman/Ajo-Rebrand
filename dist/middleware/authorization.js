"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const auth = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        if (authorization === undefined) {
            return res.status(401).send({
                status: "There is an Error",
                message: "Ensure that you are logged in"
            });
        }
        const pin = authorization.split(" ")[1];
        if (!pin || pin === "") {
            return res.status(401).send({
                status: "Error",
                message: "The pin can't be used"
            });
        }
        const decoded = jsonwebtoken_1.default.verify(pin, `${config_1.APP_SECRET}`);
        req.user = decoded;
        return next();
    }
    catch (err) {
        console.log("ERROR:", err);
        return res.status(401).send({
            status: "Error",
            message: err
        });
    }
};
exports.auth = auth;
