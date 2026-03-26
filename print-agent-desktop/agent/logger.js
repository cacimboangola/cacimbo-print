const winston = require('winston');
const config = require('./config');
const path = require('path');
const fs = require('fs');

let logsDir;
if (process.env.CONFIG_PATH) {
  logsDir = path.join(path.dirname(process.env.CONFIG_PATH), 'logs');
} else {
  logsDir = path.join(__dirname, 'logs');
}

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: config.log.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 3,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'agent.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

module.exports = logger;
