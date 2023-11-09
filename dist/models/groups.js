"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const config_1 = require("../config");
const users_1 = __importDefault(require("./users"));
var frequency;
(function (frequency) {
    frequency["DAILY"] = "Daily";
    frequency["WEEKLY"] = "Weekly";
    frequency["MONTHLY"] = "Monthly";
})(frequency || (frequency = {}));
class Groups extends sequelize_1.Model {
}
Groups.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
    },
    group_image: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        field: "Content of the post",
        allowNull: false,
    },
    admin_id: {
        type: sequelize_1.DataTypes.UUID,
        references: {
            model: users_1.default,
            key: "id",
        },
    },
    group_transactions: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    members: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    slots: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.INTEGER),
        allowNull: true,
    },
    availableSlots: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.INTEGER),
        allowNull: true,
    },
    amount_contributed: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    contribution_amount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    amount_withdrawn: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    number_of_participants: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    frequency: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(frequency)),
        allowNull: false,
    },
    duration: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    startDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
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
    // profilePicture: {
    //   type: DataTypes.STRING,
    //   allowNull: false,
    // },
}, {
    sequelize: config_1.db,
    tableName: "Groups",
    modelName: "Groups",
});
exports.default = Groups;
