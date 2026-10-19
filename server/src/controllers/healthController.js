import config from "../config/env.js";
import { sequelize } from "../config/database.js";

const healthCheck = async (req, res) => {
    const health = {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
        memory: process.memoryUsage(),
    };

    try {
        await sequelize.authenticate();
        health.database = "connected";
    } catch {
        health.database = "disconnected";
        health.status = "degraded";
    }

    const statusCode = health.database === "connected" ? 200 : 503;
    res.status(statusCode).json(health);
};

export default healthCheck;
