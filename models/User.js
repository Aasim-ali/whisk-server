import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    credits: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    planId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    dailyUsage: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    lastUsageDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
});

export default User;
