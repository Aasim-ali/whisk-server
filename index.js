import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import session from 'express-session';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import sequelize from './config/db.js';
import { User, Plan, Transaction, Session } from './models/index.js';
import passportConfig from './config/passport.js';
import authRoutes from './routes/auth.js';
import oauthRoutes from './routes/oauth.js';
import paymentRoutes from './routes/payment.js';
import adminRoutes from './routes/admin.js';
import plansRoutes from './routes/plans.js';
import publicPlansRoutes from './routes/public_plans.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust as needed for security
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Session middleware (required for Passport)
app.use(session({
    secret: process.env.SESSION_SECRET || 'whisk-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: 1000 * 60 * 60 * 24 * 10 // 10 days
    }
}));

// Initialize Passport
app.use(passportConfig.initialize());
app.use(passportConfig.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/plans', plansRoutes);
app.use('/api/plans', publicPlansRoutes);

app.get('/api/test', (req, res) => {
    res.send('Test');
});

app.get('/', (req, res) => {
    res.send('Whisk Bot API is running...');
});

// --- Socket.io Middleware & Logic ---

// Helper: Get today's date in YYYY-MM-DD format (UTC)
const getTodayDateKey = () => new Date().toISOString().split('T')[0];

io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    const deviceId = socket.handshake.auth.deviceId || socket.handshake.query.deviceId;

    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }

    if (!deviceId) {
        return next(new Error('Device ID required'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
            include: [{ model: Plan }, { model: Session }]
        });

        if (!user) {
            return next(new Error('User not found'));
        }

        socket.user = user;
        socket.deviceId = deviceId;
        next();
    } catch (err) {
        return next(new Error('Authentication error: Invalid token'));
    }
});

io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.email} (Device: ${socket.deviceId})`);

    try {
        const user = socket.user;
        const today = getTodayDateKey();

        // 1. Lazy Daily Reset
        if (user.lastUsageDate !== today) {
            user.dailyUsage = 0;
            user.lastUsageDate = today;
            await user.save();
        }

        // 2. Determine Limits (Plan or Free Tier)
        let maxDevices = 1;
        let dailyLimit = 5; // Free tier default

        if (user.Plan) {
            maxDevices = user.Plan.maxDevices;
            dailyLimit = user.Plan.dailyLimit;
        }

        // 3. Device Limit Check
        // Check active sessions for this user (excluding current if re-connecting)
        const activeSessions = await Session.findAll({ where: { userId: user.id } });
        const distinctDevices = new Set(activeSessions.map(s => s.deviceId));

        // If this device is NOT in the active set, we need to check if we have space
        if (!distinctDevices.has(socket.deviceId)) {
            if (distinctDevices.size >= maxDevices) {
                console.log(`Connection rejected: Device limit reached for ${user.email}`);
                socket.emit('error', { message: 'Device limit reached. Please disconnect other devices.' });
                socket.disconnect();
                return;
            }
        }

        // 4. Create/Update Session
        // Remove old session ID for this device if exists (cleanup)
        await Session.destroy({ where: { userId: user.id, deviceId: socket.deviceId } });

        await Session.create({
            userId: user.id,
            socketId: socket.id,
            deviceId: socket.deviceId,
            deviceInfo: { userAgent: socket.handshake.headers['user-agent'] }
        });

        // 5. Check Daily Limit on Connect (Prevent using if already exceeded)
        if (user.dailyUsage >= dailyLimit) {
            socket.emit('limit_reached', { message: 'Daily limit reached.' });
        }

        // 6. Send Initial State
        socket.emit('init_state', {
            dailyUsage: user.dailyUsage,
            dailyLimit: dailyLimit,
            planName: user.Plan ? user.Plan.name : 'Free Tier',
            firstName: user.name.split(' ')[0]
        });

        // Event: Task Complete (Image Generated)
        socket.on('task_complete', async (data) => {
            try {
                // Refresh user to get latest usage count
                const currentUser = await User.findByPk(user.id, { include: [Plan] });

                // Re-calculate limit in case plan changed
                let currentLimit = currentUser.Plan ? currentUser.Plan.dailyLimit : 5;

                if (currentUser.dailyUsage >= currentLimit) {
                    socket.emit('limit_reached', { message: 'Daily limit reached.' });
                    return;
                }

                // Increment
                currentUser.dailyUsage += 1;
                currentUser.lastUsageDate = getTodayDateKey(); // Ensure date is current
                await currentUser.save();

                // Emit update
                socket.emit('update_usage', {
                    dailyUsage: currentUser.dailyUsage,
                    dailyLimit: currentLimit
                });

                // Broadcast update to other devices of same user
                // Find all sockets for this user
                const userSessions = await Session.findAll({ where: { userId: user.id } });
                userSessions.forEach(session => {
                    if (session.socketId !== socket.id) {
                        io.to(session.socketId).emit('update_usage', {
                            dailyUsage: currentUser.dailyUsage,
                            dailyLimit: currentLimit
                        });
                    }
                });

                if (currentUser.dailyUsage >= currentLimit) {
                    socket.emit('limit_reached', { message: 'Daily limit reached.' });
                }

            } catch (err) {
                console.error('Error processing task_complete:', err);
            }
        });

        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${user.email}`);
            await Session.destroy({ where: { socketId: socket.id } });
        });

    } catch (error) {
        console.error('Socket connection error:', error);
        socket.disconnect();
    }
});


// Sync Database and Start Server
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        // Sync models
        await sequelize.sync({ force: false, alter: true });
        console.log('Models synced...');

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();
