import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Plan = sequelize.define('Plan', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.INTEGER, // in smallest currency unit (e.g. paise for INR)
        allowNull: false,
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'INR',
    },
    credits: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    features: {
        type: DataTypes.JSON,
        defaultValue: [],
    },
    maxDevices: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
    },
    dailyLimit: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
    },
    durationDays: {
        type: DataTypes.INTEGER,
        defaultValue: 30, // How many days the plan lasts after purchase
        allowNull: false,
    },
});

export default Plan;
