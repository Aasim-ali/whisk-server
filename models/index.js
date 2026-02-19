import User from './User.js';
import Plan from './Plan.js';
import Transaction from './Transaction.js';
import Admin from './Admin.js';
import Contact from './Contact.js';

import Session from './Session.js';

// Associations
User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

Plan.hasMany(Transaction, { foreignKey: 'planId' });
Transaction.belongsTo(Plan, { foreignKey: 'planId' });

User.belongsTo(Plan, { foreignKey: 'planId' });
Plan.hasMany(User, { foreignKey: 'planId' });

User.hasMany(Session, { foreignKey: 'userId' });
Session.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Contact, { foreignKey: 'userId' });
Contact.belongsTo(User, { foreignKey: 'userId' });

export { User, Plan, Transaction, Admin, Session, Contact };
