"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transaction_type = exports.transaction_status = exports.action = void 0;
const sequelize_1 = require("sequelize");
const config_1 = require("../config");
const wallets_1 = __importDefault(require("./wallets"));
const users_1 = __importDefault(require("./users"));
var action;
(function (action) {
    action["DEBIT"] = "Debit";
    action["CREDIT"] = "Credit";
})(action || (exports.action = action = {}));
var transaction_status;
(function (transaction_status) {
    transaction_status["SUCCESSFUL"] = "Successful";
    transaction_status["PENDING"] = "Pending";
    transaction_status["UNSUCCESSFUL"] = "Unsuccessful";
})(transaction_status || (exports.transaction_status = transaction_status = {}));
var transaction_type;
(function (transaction_type) {
    transaction_type["GLOBAL"] = "Global";
    transaction_type["SAVINGS"] = "Savings";
    transaction_type["GROUP_WALLET"] = "Group Wallet";
})(transaction_type || (exports.transaction_type = transaction_type = {}));
class Transactions extends sequelize_1.Model {
}
Transactions.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
    },
    wallet_id: {
        type: sequelize_1.DataTypes.UUID,
        references: {
            model: wallets_1.default,
            key: "id",
        },
    },
    owner_id: {
        type: sequelize_1.DataTypes.UUID,
        references: {
            model: users_1.default,
            key: "id",
        },
    },
    amount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(transaction_status)),
        allowNull: false,
    },
    action: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(action)),
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(transaction_type)),
        allowNull: false,
    },
    receiver: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: config_1.db,
    tableName: "Transactions",
    modelName: "Transactions",
});
Transactions.belongsTo(wallets_1.default, {
    foreignKey: "wallet_id",
});
Transactions.belongsTo(users_1.default, {
    foreignKey: "owner_id",
});
exports.default = Transactions;
