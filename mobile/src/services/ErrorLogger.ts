/**
 * ErrorLogger - 앱 크래시 및 에러 추적 서비스
 *
 * 각 화면과 서비스에서 발생하는 에러를 수집하고 분석할 수 있도록 로깅
 * Production에서는 Sentry/Crashlytics 등과 연동 가능
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// 에러 로그 타입
export type ErrorSeverity = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface ErrorLog {
  id: string;
  timestamp: string;
  severity: ErrorSeverity;
  screen: string;
  component?: string;
  action: string;
  message: string;
  stack?: string;
  metadata?: Record<string, any>;
  deviceInfo?: {
    platform: string;
    version: string;
    memoryUsage?: number;
  };
}

// 로그 저장 키
const ERROR_LOG_KEY = '@heeling_error_logs';
const MAX_LOGS = 500; // 최대 저장 로그 수

// 심각도별 색상 (콘솔 출력용)
const SEVERITY_COLORS: Record<ErrorSeverity, string> = {
  debug: '\x1b[90m',   // gray
  info: '\x1b[36m',    // cyan
  warn: '\x1b[33m',    // yellow
  error: '\x1b[31m',   // red
  fatal: '\x1b[35m',   // magenta
};

const RESET_COLOR = '\x1b[0m';

// 유니크 ID 생성
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * ErrorLogger 서비스
 */
export const ErrorLogger = {
  // 메모리 내 로그 버퍼 (빠른 접근용)
  _logs: [] as ErrorLog[],
  _initialized: false,

  /**
   * 초기화 - 저장된 로그 로드
   */
  async initialize(): Promise<void> {
    if (this._initialized) return;

    try {
      const stored = await AsyncStorage.getItem(ERROR_LOG_KEY);
      if (stored) {
        this._logs = JSON.parse(stored);
      }
      this._initialized = true;
      this.info('ErrorLogger', 'initialize', 'ErrorLogger initialized', {
        existingLogs: this._logs.length,
      });
    } catch (error) {
      console.error('[ErrorLogger] Failed to initialize:', error);
      this._logs = [];
      this._initialized = true;
    }
  },

  /**
   * 로그 기록 (내부)
   */
  async _log(
    severity: ErrorSeverity,
    screen: string,
    action: string,
    message: string,
    options?: {
      component?: string;
      error?: Error;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const log: ErrorLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      severity,
      screen,
      component: options?.component,
      action,
      message,
      stack: options?.error?.stack,
      metadata: options?.metadata,
    };

    // 콘솔 출력
    const color = SEVERITY_COLORS[severity];
    const prefix = `[${severity.toUpperCase()}][${screen}]`;
    const logMessage = `${color}${prefix}${RESET_COLOR} ${action}: ${message}`;

    if (severity === 'error' || severity === 'fatal') {
      console.error(logMessage, options?.metadata || '', options?.error || '');
    } else if (severity === 'warn') {
      console.warn(logMessage, options?.metadata || '');
    } else {
      console.log(logMessage, options?.metadata || '');
    }

    // 메모리에 추가
    this._logs.unshift(log);

    // 최대 개수 초과 시 오래된 로그 제거
    if (this._logs.length > MAX_LOGS) {
      this._logs = this._logs.slice(0, MAX_LOGS);
    }

    // 비동기로 저장 (에러/fatal만 즉시 저장)
    if (severity === 'error' || severity === 'fatal') {
      await this._persist();
    }
  },

  /**
   * 로그 저장
   */
  async _persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(this._logs));
    } catch (error) {
      console.error('[ErrorLogger] Failed to persist logs:', error);
    }
  },

  /**
   * Debug 로그
   */
  debug(screen: string, action: string, message: string, metadata?: Record<string, any>): void {
    this._log('debug', screen, action, message, { metadata });
  },

  /**
   * Info 로그
   */
  info(screen: string, action: string, message: string, metadata?: Record<string, any>): void {
    this._log('info', screen, action, message, { metadata });
  },

  /**
   * Warning 로그
   */
  warn(screen: string, action: string, message: string, metadata?: Record<string, any>): void {
    this._log('warn', screen, action, message, { metadata });
  },

  /**
   * Error 로그
   */
  error(
    screen: string,
    action: string,
    message: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    this._log('error', screen, action, message, { error, metadata });
  },

  /**
   * Fatal 로그 (앱 크래시 수준)
   */
  fatal(
    screen: string,
    action: string,
    message: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    this._log('fatal', screen, action, message, { error, metadata });
  },

  /**
   * 컴포넌트별 로거 생성
   */
  forScreen(screen: string) {
    return {
      debug: (action: string, message: string, metadata?: Record<string, any>) =>
        this.debug(screen, action, message, metadata),
      info: (action: string, message: string, metadata?: Record<string, any>) =>
        this.info(screen, action, message, metadata),
      warn: (action: string, message: string, metadata?: Record<string, any>) =>
        this.warn(screen, action, message, metadata),
      error: (action: string, message: string, error?: Error, metadata?: Record<string, any>) =>
        this.error(screen, action, message, error, metadata),
      fatal: (action: string, message: string, error?: Error, metadata?: Record<string, any>) =>
        this.fatal(screen, action, message, error, metadata),
    };
  },

  /**
   * 모든 로그 조회
   */
  getLogs(options?: {
    severity?: ErrorSeverity;
    screen?: string;
    limit?: number;
    since?: Date;
  }): ErrorLog[] {
    let logs = [...this._logs];

    if (options?.severity) {
      logs = logs.filter(log => log.severity === options.severity);
    }

    if (options?.screen) {
      logs = logs.filter(log => log.screen === options.screen);
    }

    if (options?.since) {
      const sinceTime = options.since.getTime();
      logs = logs.filter(log => new Date(log.timestamp).getTime() >= sinceTime);
    }

    if (options?.limit) {
      logs = logs.slice(0, options.limit);
    }

    return logs;
  },

  /**
   * 에러 로그만 조회
   */
  getErrors(limit: number = 50): ErrorLog[] {
    return this.getLogs({ severity: 'error', limit });
  },

  /**
   * Fatal 로그만 조회
   */
  getFatalErrors(): ErrorLog[] {
    return this.getLogs({ severity: 'fatal' });
  },

  /**
   * 화면별 에러 통계
   */
  getErrorStats(): Record<string, { errors: number; warnings: number; fatals: number }> {
    const stats: Record<string, { errors: number; warnings: number; fatals: number }> = {};

    this._logs.forEach(log => {
      if (!stats[log.screen]) {
        stats[log.screen] = { errors: 0, warnings: 0, fatals: 0 };
      }

      if (log.severity === 'error') stats[log.screen].errors++;
      if (log.severity === 'warn') stats[log.screen].warnings++;
      if (log.severity === 'fatal') stats[log.screen].fatals++;
    });

    return stats;
  },

  /**
   * 로그 내보내기 (디버깅용)
   */
  async exportLogs(): Promise<string> {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalLogs: this._logs.length,
      stats: this.getErrorStats(),
      logs: this._logs,
    };
    return JSON.stringify(exportData, null, 2);
  },

  /**
   * 모든 로그 삭제
   */
  async clearLogs(): Promise<void> {
    this._logs = [];
    await AsyncStorage.removeItem(ERROR_LOG_KEY);
    this.info('ErrorLogger', 'clearLogs', 'All logs cleared');
  },

  /**
   * 오래된 로그 정리 (7일 이상)
   */
  async cleanupOldLogs(daysToKeep: number = 7): Promise<number> {
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    const originalCount = this._logs.length;

    this._logs = this._logs.filter(
      log => new Date(log.timestamp).getTime() > cutoff
    );

    const removedCount = originalCount - this._logs.length;

    if (removedCount > 0) {
      await this._persist();
      this.info('ErrorLogger', 'cleanupOldLogs', `Removed ${removedCount} old logs`);
    }

    return removedCount;
  },
};

export default ErrorLogger;
