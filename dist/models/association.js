"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const wallets_1 = __importDefault(require("./wallets"));
const transactions_1 = __importDefault(require("./transactions"));
const users_1 = __importDefault(require("./users"));
const savings_1 = __importDefault(require("./savings"));
const groups_1 = __importDefault(require("./groups"));
const payment_1 = __importDefault(require("./payment"));
const settings_1 = __importDefault(require("./settings"));
// Define your associations here
wallets_1.default.hasMany(transactions_1.default, {
    foreignKey: "wallet_id"
});
transactions_1.default.belongsTo(wallets_1.default, {
    foreignKey: "wallet_id"
});
transactions_1.default.belongsTo(users_1.default, {
    foreignKey: "owner_id"
});
users_1.default.hasMany(transactions_1.default, {
    foreignKey: "owner_id"
});
savings_1.default.belongsTo(users_1.default, {
    foreignKey: "user_id"
});
groups_1.default.hasMany(transactions_1.default, {
    foreignKey: "owner_id"
});
users_1.default.hasMany(payment_1.default, {
    foreignKey: "owner_id"
});
settings_1.default.belongsTo(users_1.default, {
    foreignKey: "owner_id"
});
