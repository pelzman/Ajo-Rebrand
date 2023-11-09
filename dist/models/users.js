"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.role = void 0;
const sequelize_1 = require("sequelize");
const config_1 = require("../config");
var role;
(function (role) {
    role["ADMIN"] = "Admin";
    role["CONTRIBUTOR"] = "Contributor"; //NORMAL USER
})(role || (exports.role = role = {}));
class Users extends sequelize_1.Model {
}
Users.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        allowNull: false
    },
    firstName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    profilePic: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true
    },
    otp: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(role)),
        allowNull: false
    },
    phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    },
    gender: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    occupation: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    date_of_birth: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.DATE
    },
    bvn: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    identification_number: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    identification_doc: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    proof_of_address_doc: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    // identification_type: {
    //   type: DataTypes.ENUM(...Object.values(identificationType)),
    //   allowNull: true
    // },
}, {
    sequelize: config_1.db,
    tableName: "Users",
    modelName: "Users"
});
exports.default = Users;
