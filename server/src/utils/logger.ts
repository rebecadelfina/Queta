import fs from "fs";
import path from "path";

const logsDir = path.join(process.cwd(), "logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

type LogLevel = "INFO" | "ERROR" | "WARN" | "DEBUG";

const getTimestamp = () => new Date().toISOString();

const formatLog = (level: LogLevel, message: string, data?: any) => {
  const timestamp = getTimestamp();
  const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : "";
  return `[${timestamp}] [${level}] ${message}${dataStr}`;
};

const writeLog = (level: LogLevel, message: string, data?: any) => {
  const logFile = path.join(logsDir, `${level.toLowerCase()}-${new Date().toISOString().split("T")[0]}.log`);
  const logMessage = formatLog(level, message, data);
  fs.appendFileSync(logFile, logMessage + "\n");
};

export const logger = {
  info: (message: string, data?: any) => {
    const msg = formatLog("INFO", message, data);
    console.log(msg);
    writeLog("INFO", message, data);
  },
  error: (message: string, error?: any) => {
    const msg = formatLog("ERROR", message, error);
    console.error(msg);
    writeLog("ERROR", message, error);
  },
  warn: (message: string, data?: any) => {
    const msg = formatLog("WARN", message, data);
    console.warn(msg);
    writeLog("WARN", message, data);
  },
  debug: (message: string, data?: any) => {
    if (process.env.DEBUG === "true") {
      const msg = formatLog("DEBUG", message, data);
      console.debug(msg);
      writeLog("DEBUG", message, data);
    }
  },
};
