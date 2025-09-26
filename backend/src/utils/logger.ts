interface Logger {
  info: (message: string, meta?: any) => void
  error: (message: string, meta?: any) => void
  warn: (message: string, meta?: any) => void
}

const logger: Logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, meta || '')
  },
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, meta || '')
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, meta || '')
  },
}

export default logger
