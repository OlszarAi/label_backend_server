import { config } from '../config/config';

// ANSI color codes
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
};

export class Logger {
  private static formatTime(): string {
    return new Date().toLocaleTimeString('pl-PL', {
      hour12: false,
      timeZone: 'Europe/Warsaw'
    });
  }

  private static formatMessage(level: string, message: string, color: string): string {
    const timestamp = this.formatTime();
    return `${colors.dim}[${timestamp}]${colors.reset} ${color}${level}${colors.reset} ${message}`;
  }

  static info(message: string): void {
    console.log(this.formatMessage('INFO', message, colors.blue));
  }

  static success(message: string): void {
    console.log(this.formatMessage('SUCCESS', message, colors.green));
  }

  static warning(message: string): void {
    console.log(this.formatMessage('WARNING', message, colors.yellow));
  }

  static error(message: string, error?: any): void {
    console.log(this.formatMessage('ERROR', message, colors.red));
    if (error) {
      console.error(colors.red + error.stack || error + colors.reset);
    }
  }

  static debug(message: string): void {
    if (config.nodeEnv === 'development') {
      console.log(this.formatMessage('DEBUG', message, colors.magenta));
    }
  }

  static server(message: string): void {
    console.log(this.formatMessage('SERVER', message, colors.cyan));
  }

  static database(message: string): void {
    console.log(this.formatMessage('DATABASE', message, colors.green));
  }

  static startup(): void {
    console.clear(); // Czyści terminal
    const nodeVersion = process.version;
    const memory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const time = new Date().toLocaleTimeString('pl-PL', { hour12: false });
    
    console.log(`${colors.cyan}${colors.bright}🏷️  LABEL BACKEND SERVER${colors.reset} ${colors.dim}v1.0.0${colors.reset}`);
    console.log(`${colors.dim}═══════════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.yellow}🌍 ${config.nodeEnv}${colors.reset} ${colors.dim}|${colors.reset} ${colors.green}Node ${nodeVersion}${colors.reset} ${colors.dim}|${colors.reset} ${colors.blue}Memory: ${memory}MB${colors.reset} ${colors.dim}|${colors.reset} ${colors.magenta}${time}${colors.reset}`);
    console.log(`${colors.dim}═══════════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log('');
  }

  static showStatusBar(): void {
    const time = new Date().toLocaleTimeString('pl-PL', { hour12: false });
    const memory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    
    // Pozycjonuj kursor na górze
    process.stdout.write('\u001b[s'); // Save cursor position
    process.stdout.write('\u001b[1;1H'); // Move to top-left
    
    console.log(`${colors.cyan}${colors.bright}�️  LABEL BACKEND SERVER${colors.reset} ${colors.dim}v1.0.0${colors.reset}`);
    console.log(`${colors.dim}═══════════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}🚀 READY${colors.reset} ${colors.dim}|${colors.reset} ${colors.cyan}:${config.port}${colors.reset} ${colors.dim}|${colors.reset} ${colors.green}✅ DB${colors.reset} ${colors.dim}|${colors.reset} ${colors.blue}${memory}MB${colors.reset} ${colors.dim}|${colors.reset} ${colors.magenta}${time}${colors.reset} ${colors.dim}| Ctrl+C to stop${colors.reset}`);
    console.log(`${colors.dim}═══════════════════════════════════════════════════════════════════════════════${colors.reset}`);
    
    process.stdout.write('\u001b[u'); // Restore cursor position
  }

  static ready(): void {
    console.log(`${colors.green}${colors.bright}� SERVER READY${colors.reset} - Listening on port ${colors.cyan}${config.port}${colors.reset}`);
    console.log(`${colors.dim}───────────────────────────────────────────────────────────────────────────────${colors.reset}`);
    console.log(`${colors.blue}Endpoints:${colors.reset} ${colors.cyan}/health${colors.reset} ${colors.dim}|${colors.reset} ${colors.cyan}/api/auth${colors.reset} ${colors.dim}|${colors.reset} ${colors.cyan}/api/projects${colors.reset}`);
    console.log(`${colors.magenta}Commands:${colors.reset} ${colors.yellow}npm run db:studio${colors.reset} ${colors.dim}|${colors.reset} ${colors.yellow}npm run health${colors.reset}`);
    console.log(`${colors.dim}───────────────────────────────────────────────────────────────────────────────${colors.reset}`);
    console.log('');
  }

  static separator(): void {
    console.log(`${colors.dim}───────────────────────────────────────────────────────────────────────────────${colors.reset}`);
  }

  static compactSeparator(): void {
    console.log(`${colors.dim}··················································································${colors.reset}`);
  }

  static newLine(): void {
    console.log('');
  }
}
