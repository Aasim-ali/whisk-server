import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    razorpay_order_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    razorpay_payment_id: {
        type: DataTypes.STRING,
    },
    razorpay_signature: {
        type: DataTypes.STRING,
    },
    status: {
        type: DataTypes.ENUM('pending', 'success', 'failed'),
        defaultValue: 'pending',
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    planId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Plans',
            key: 'id'
        }
    }
}, {
    tableName: 'Transactions',
    timestamps: true,
});

export default Transaction;
