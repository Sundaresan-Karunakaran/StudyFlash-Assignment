-- SQL Schema for Support Platform MVP (Supabase)

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT,
    body_original TEXT NOT NULL,
    body_translated TEXT,
    language VARCHAR(10),
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'open',
    urgency VARCHAR(20) DEFAULT 'medium',
    assignee_id UUID,
    assignee_name VARCHAR(255),
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    ai_draft_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'user', 'agent', 'ai'
    sender_name VARCHAR(255),
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mock Enrichment Data 
CREATE TABLE IF NOT EXISTS user_data_mocks (
    user_email VARCHAR(255) PRIMARY KEY,
    sentry_error_link TEXT,
    posthog_session_link TEXT,
    total_spend NUMERIC DEFAULT 0
);

-- Enable Realtime for Auto-updating Web UI
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

