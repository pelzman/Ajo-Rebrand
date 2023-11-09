"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.type = void 0;
const sequelize_1 = require("sequelize");
const config_1 = require("../config");
var type;
(function (type) {
    type["GLOBAL"] = "Global";
    type["SAVINGS"] = "Savings";
    type["GROUP_WALLET"] = "Group Wallet";
})(type || (exports.type = type = {}));
class Wallets extends sequelize_1.Model {
}
Wallets.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        allowNull: false
    },
    user_id: {
        type: sequelize_1.DataTypes.UUID,
        // references: {
        //   model: Users,
        //   key: "id",
        // },
    },
    total_amount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    },
    total_group_savings: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true
    },
    total_income: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true
    },
    total_personal_savings: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true
    },
    earnings: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true
    },
    type: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(type)),
        allowNull: false
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    },
}, {
    sequelize: config_1.db,
    tableName: "Wallets",
    modelName: "Wallets"
});
exports.default = Wallets;
