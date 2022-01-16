import winston from "winston";

const logger = winston.createLogger({
	level: "debug",
	format: winston.format.combine(
		winston.format.timestamp({
			format: "YYYY-MM-DD HH:mm:ss"
		}),
		winston.format.errors({ stack: true }),
		winston.format.splat(),
		winston.format.json()
	),
	defaultMeta: { service: "huidu-sdk" },
	transports: [
		new winston.transports.File({ filename: "./logs/quick-start-error.log", level: "error" }),
		new winston.transports.File({ filename: "./logs/quick-start-combined.log" })
	]
});

if (process.env.NODE_ENV !== "production") {
	logger.add(new winston.transports.Console({
		format: winston.format.combine(
			winston.format.colorize(),
			winston.format.simple()
		)
	}));
}

export default logger;