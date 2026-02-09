CREATE TABLE IF NOT EXISTS cron_logs (
  id SERIAL PRIMARY KEY,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL,
  emails_sent INTEGER DEFAULT 0,
  emails_failed INTEGER DEFAULT 0,
  error_message TEXT,
  execution_time_ms INTEGER,
  cron_mode VARCHAR(50)
);
