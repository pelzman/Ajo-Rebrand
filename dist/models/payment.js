"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const sequelize_1 = require("sequelize");
const config_1 = require("../config");
const users_1 = __importDefault(require("./users"));
class Payment extends sequelize_1.Model {
}
exports.Payment = Payment;
Payment.init({
    reference: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
    },
    paystackId: {
        type: sequelize_1.DataTypes.STRING,
    },
    admin_id: {
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
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.STRING,
        defaultValue: "initiated"
    },
}, {
    sequelize: config_1.db,
    tableName: 'payments',
});
exports.default = Payment;
