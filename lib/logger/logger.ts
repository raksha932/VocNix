export type LogEventType =
  | 'AUTHENTICATION'
  | 'EVENT_CREATED'
  | 'EVENT_STARTED'
  | 'EVENT_ENDED'
  | 'TRANSLATOR_CONNECTED'
  | 'TRANSLATOR_DISCONNECTED'
  | 'SESSION_STARTED'
  | 'SESSION_PAUSED'
  | 'SESSION_RESUMED'
  | 'SESSION_STOPPED'
  | 'AUDIENCE_JOINED'
  | 'AUDIENCE_LEFT'
  | 'USAGE_RECORDED'
  | 'TOKEN_GENERATED'
  | 'SECURITY_FAILURE';

export interface StructuredLog {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  eventType: LogEventType;
  organizationId?: string;
  message: string;
  metadata?: Record<string, any>;
}

export const Logger = {
  log(level: 'INFO' | 'WARN' | 'ERROR', eventType: LogEventType, message: string, meta?: {
    organizationId?: string;
    [key: string]: any;
  }) {
    const { organizationId, ...extraMeta } = meta || {};
    
    // Strict requirement: Never log private secrets or tokens
    const sanitizedMeta = { ...extraMeta };
    delete sanitizedMeta.token;
    delete sanitizedMeta.apiKey;
    delete sanitizedMeta.apiSecret;
    delete sanitizedMeta.serviceRoleKey;

    const entry: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      eventType,
      organizationId,
      message,
      metadata: Object.keys(sanitizedMeta).length > 0 ? sanitizedMeta : undefined,
    };

    const formatted = `[${entry.timestamp}] [${entry.level}] [${entry.eventType}] ${entry.message}${
      entry.organizationId ? ` (Org: ${entry.organizationId})` : ''
    }${entry.metadata ? ` | Meta: ${JSON.stringify(entry.metadata)}` : ''}`;

    if (level === 'ERROR') {
      console.error(formatted);
    } else if (level === 'WARN') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  },

  info(eventType: LogEventType, message: string, meta?: Record<string, any>) {
    this.log('INFO', eventType, message, meta);
  },

  warn(eventType: LogEventType, message: string, meta?: Record<string, any>) {
    this.log('WARN', eventType, message, meta);
  },

  error(eventType: LogEventType, message: string, meta?: Record<string, any>) {
    this.log('ERROR', eventType, message, meta);
  },
};
