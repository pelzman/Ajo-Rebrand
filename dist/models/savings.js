"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.frequency = void 0;
const sequelize_1 = require("sequelize");
const config_1 = require("../config");
const users_1 = __importDefault(require("./users"));
var frequency;
(function (frequency) {
    frequency["DAILY"] = "Daily";
    frequency["WEEKLY"] = "Weekly";
    frequency["MONTHLY"] = "Monthly";
    frequency["ANNUALLY"] = "Annually";
})(frequency || (exports.frequency = frequency = {}));
var category;
(function (category) {
    category["TRAVEL"] = "Travel";
    category["DREAM_HOME"] = "Dream_Home";
    category["DREAM_CAR"] = "Dream_Car";
    category["RENT"] = "Rent";
    category["GADGETS"] = "Gadgets";
    category["OTHER"] = "Other";
})(category || (category = {}));
class Savings extends sequelize_1.Model {
}
Savings.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
    },
    user_id: {
        type: sequelize_1.DataTypes.UUID,
        references: {
            model: users_1.default,
            key: "id",
        },
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    target: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    frequency: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(frequency)),
        allowNull: false,
    },
    category: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(category)),
        allowNull: false,
    },
    startDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    target_amount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    },
    amount_saved: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    },
    endDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.DATE,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: config_1.db,
    tableName: "Savings",
    modelName: "Savings",
});
exports.default = Savings;
