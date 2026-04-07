CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  meta_campaign_id VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50),
  effective_status VARCHAR(50),
  objective VARCHAR(100),
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  ctr NUMERIC(10,4) DEFAULT 0,
  cpc NUMERIC(12,4) DEFAULT 0,
  spend NUMERIC(14,2) DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  cost_per_lead NUMERIC(14,2) DEFAULT 0,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_json JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  meta_lead_id VARCHAR(120) UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(60),
  source VARCHAR(100),
  campaign_meta_id VARCHAR(80),
  campaign_name VARCHAR(255),
  ad_id VARCHAR(80),
  ad_name VARCHAR(255),
  form_id VARCHAR(80),
  status VARCHAR(50) DEFAULT 'Novo',
  score INTEGER DEFAULT 50,
  notes TEXT,
  utm_source VARCHAR(120),
  utm_medium VARCHAR(120),
  utm_campaign VARCHAR(120),
  utm_content VARCHAR(120),
  estimated_revenue NUMERIC(14,2) DEFAULT 0,
  created_at_meta TIMESTAMP WITH TIME ZONE,
  created_at_local TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_json JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(80) NOT NULL,
  level VARCHAR(20) NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pixel_events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(120) NOT NULL,
  event_id VARCHAR(120),
  user_data JSONB,
  custom_data JSONB,
  meta_response JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_campaigns_meta_campaign_id ON campaigns(meta_campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_meta_lead_id ON leads(meta_lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_meta_id ON leads(campaign_meta_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at_local ON leads(created_at_local DESC);
CREATE INDEX IF NOT EXISTS idx_pixel_events_event_name ON pixel_events(event_name);
CREATE INDEX IF NOT EXISTS idx_pixel_events_created_at ON pixel_events(created_at DESC);
