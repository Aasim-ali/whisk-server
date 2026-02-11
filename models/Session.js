import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    socketId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    deviceId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    deviceInfo: {
        type: DataTypes.JSON,
        allowNull: true,
    },
});

export default Session;
