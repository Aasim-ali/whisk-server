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
        allowNull: true, // Nullable for Google OAuth users
    },
    googleId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
    },
    authProvider: {
        type: DataTypes.ENUM('local', 'google'),
        defaultValue: 'local',
        allowNull: false,
    },
    profilePicture: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    credits: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    planId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    planExpiresAt: {
        type: DataTypes.DATE,
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
    resetOtp: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    resetOtpExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    resetOtpAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    tableName: 'Users',
    timestamps: true,
});

export default User;
