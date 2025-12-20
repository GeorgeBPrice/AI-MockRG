import { SchemaTemplate, SchemaTemplateCategory } from "@/types/template"

const schemaTemplates: SchemaTemplate[] = [
  // authentication
  {
    id: "auth-sessions-sql",
    name: "Auth Sessions",
    description: "Track login sessions, devices, and expiration metadata.",
    category: "authentication",
    schemaType: "sql",
    schema: `
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  device TEXT,
  ip VARCHAR(45),
  last_used TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);`,
    schemas: {
      sql: `
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  device TEXT,
  ip VARCHAR(45),
  last_used TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);`,
      nosql: `{
  "type": "authSession",
  "id": "sess_a12",
  "userId": "user_123",
  "device": "web",
  "ip": "198.51.100.23",
  "lastUsed": "2025-07-02T12:00:00Z",
  "expiresAt": "2025-07-02T14:00:00Z"
}`,
    },
    tags: ["security", "sessions"],
    popularity: 68,
  },
  {
    id: "auth-tokens-nosql",
    name: "Token Registry",
    description: "Documents refresh/PSK tokens with geolocation and status.",
    category: "authentication",
    schemaType: "nosql",
    schema: `
{
  "tokenId": "tok_abc",
  "userId": "user_123",
  "scopes": ["generate", "read"],
  "createdAt": "2025-06-30T12:00:00Z",
  "isActive": true
}`,
    schemas: {
      sql: `
CREATE TABLE token_registry (
  id UUID PRIMARY KEY,
  user_id UUID,
  token TEXT,
  scopes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);`,
      nosql: `
{
  "tokenId": "tok_abc",
  "userId": "user_123",
  "scopes": ["generate", "read"],
  "createdAt": "2025-06-30T12:00:00Z",
  "isActive": true
}`,
    },
    tags: ["tokens", "auth"],
    popularity: 61,
  },
  {
    id: "auth-factors-sql",
    name: "Auth Factors",
    description: "Store MFA devices, recovery codes, and status.",
    category: "authentication",
    schemaType: "sql",
    schema: `
CREATE TABLE auth_factors (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(32),
  last_used TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);`,
    schemas: {
      sql: `
CREATE TABLE auth_factors (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(32),
  last_used TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);`,
      nosql: `{
  "factorId": "factor_123",
  "userId": "user_123",
  "type": "totp",
  "lastUsed": "2025-07-02T11:00:00Z",
  "isActive": true
}`,
    },
    tags: ["mfa", "security"],
    popularity: 55,
  },
  {
    id: "auth-logs-sql",
    name: "Auth Event Log",
    description: "Audit login/logout events with IP and outcome.",
    category: "authentication",
    schemaType: "sql",
    schema: `
CREATE TABLE authentication_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  event VARCHAR(64),
  outcome VARCHAR(32),
  ip_address VARCHAR(45),
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);`,
    schemas: {
      sql: `
CREATE TABLE authentication_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  event VARCHAR(64),
  outcome VARCHAR(32),
  ip_address VARCHAR(45),
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);`,
      nosql: `{
  "eventId": "evt_001",
  "userId": "user_123",
  "event": "login",
  "outcome": "success",
  "ipAddress": "198.51.100.10",
  "occurredAt": "2025-07-02T10:00:00Z"
}`,
    },
    tags: ["audit", "security"],
    popularity: 63,
  },
  {
    id: "auth-reset-nosql",
    name: "Reset Tokens",
    description: "Temporary tokens for password reset/verification flows.",
    category: "authentication",
    schemaType: "nosql",
    schema: `
{
  "resetId": "reset_098",
  "userId": "user_123",
  "token": "abc123",
  "expiresAt": "2025-07-02T13:00:00Z"
}`,
    schemas: {
      sql: `
CREATE TABLE password_resets (
  id UUID PRIMARY KEY,
  user_id UUID,
  token TEXT,
  expires_at TIMESTAMPTZ,
  used BOOLEAN DEFAULT FALSE
);`,
      nosql: `
{
  "resetId": "reset_098",
  "userId": "user_123",
  "token": "abc123",
  "expiresAt": "2025-07-02T13:00:00Z"
}`,
    },
    tags: ["verification"],
    popularity: 48,
  },
  {
    id: "auth-policies-sql",
    name: "Security Policies",
    description: "Define password/min-height/lockout rules by role.",
    category: "authentication",
    schemaType: "sql",
    schema: `
CREATE TABLE security_policies (
  id UUID PRIMARY KEY,
  name TEXT,
  min_length INT,
  requires_symbols BOOLEAN,
  lockout_threshold INT
);`,
    schemas: {
      sql: `
CREATE TABLE security_policies (
  id UUID PRIMARY KEY,
  name TEXT,
  min_length INT,
  requires_symbols BOOLEAN,
  lockout_threshold INT
);`,
      nosql: `{
  "policyId": "policy_01",
  "name": "Default",
  "rules": {
    "minLength": 12,
    "requiresSymbols": true,
    "lockoutThreshold": 5
  }
}`,
    },
    tags: ["policy", "security"],
    popularity: 46,
  },

  // profiles
  {
    id: "profiles-base-sql",
    name: "Profile Base",
    description: "Core profile information for all users.",
    category: "profiles",
    schemaType: "sql",
    schema: `
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  display_name TEXT,
  bio TEXT,
  locale TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`,
    schemas: {
      sql: `
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  display_name TEXT,
  bio TEXT,
  locale TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`,
      nosql: `{
  "profileId": "profile_123",
  "userId": "user_123",
  "displayName": "Lena",
  "bio": "Developer",
  "locale": "en-US",
  "createdAt": "2025-07-01T10:00:00Z"
}`,
    },
    tags: ["ui", "profiles"],
    popularity: 67,
  },
  {
    id: "profiles-meta-nosql",
    name: "Profile Metadata",
    description: "Persist preferences, badges, and saved items.",
    category: "profiles",
    schemaType: "nosql",
    schema: `
{
  "userId": "user_123",
  "badges": ["beta_tester"],
  "preferences": {
    "view": "compact",
    "notifications": true
  }
}`,
    schemas: {
      sql: `
CREATE TABLE profile_metadata (
  profile_id UUID PRIMARY KEY,
  badges TEXT[],
  preferences JSONB
);`,
      nosql: `{
  "userId": "user_123",
  "badges": ["beta_tester"],
  "preferences": {
    "view": "compact",
    "notifications": true
  }
}`,
    },
    tags: ["preferences"],
    popularity: 62,
  },
  {
    id: "profiles-connections-sql",
    name: "Connections Graph",
    description: "Store follows/friends relationships with metadata.",
    category: "profiles",
    schemaType: "sql",
    schema: `
CREATE TABLE profile_connections (
  id SERIAL PRIMARY KEY,
  profile_a UUID,
  profile_b UUID,
  relation_type VARCHAR(32),
  created_at TIMESTAMPTZ DEFAULT NOW()
);`,
    tags: ["network"],
    popularity: 58,
    schemas: {
      sql: `
CREATE TABLE profile_connections (
  id SERIAL PRIMARY KEY,
  profile_a UUID,
  profile_b UUID,
  relation_type VARCHAR(32),
  created_at TIMESTAMPTZ DEFAULT NOW()
);`,
      nosql: `{
  "connectionId": "conn_123",
  "profiles": ["profile_a", "profile_b"],
  "relationType": "follows",
  "createdAt": "2025-07-02T12:15:00Z"
}`,
    },
  },
  {
    id: "profiles-avatars-sql",
    name: "Avatar Metadata",
    description: "Manage profile avatars across variants and alt text.",
    category: "profiles",
    schemaType: "sql",
    schema: `
CREATE TABLE profile_avatars (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  url TEXT,
  variant VARCHAR(32),
  alt_text TEXT
);`,
    tags: ["media"],
    popularity: 52,
    schemas: {
      sql: `
CREATE TABLE profile_avatars (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  url TEXT,
  variant VARCHAR(32),
  alt_text TEXT
);`,
      nosql: `{
  "avatarId": "avatar_123",
  "profileId": "profile_123",
  "url": "https://cdn.example/avatar.png",
  "variant": "default",
  "altText": "Profile picture"
}`,
    },
  },
  {
    id: "profiles-preferences-nosql",
    name: "Profile Preferences",
    description: "JSON preferences for UI layout, timezone, and locale.",
    category: "profiles",
    schemaType: "nosql",
    schema: `
{
  "userId": "user_123",
  "preferences": {
    "theme": "dark",
    "timezone": "America/New_York"
  }
}`,
    tags: ["preferences"],
    popularity: 44,
    schemas: {
      sql: `
CREATE TABLE profile_preferences (
  id UUID PRIMARY KEY,
  user_id UUID,
  preferences JSONB
);`,
      nosql: `
{
  "userId": "user_123",
  "preferences": {
    "theme": "dark",
    "timezone": "America/New_York"
  }
}`,
    },
  },
  {
    id: "profiles-activity-nosql",
    name: "Activity Timeline",
    description: "Capture recent profile actions with timestamps.",
    category: "profiles",
    schemaType: "nosql",
    schema: `
{
  "userId": "user_123",
  "activities": [
    { "event": "login", "ts": "2025-07-02T13:00:00Z" }
  ]
}`,
    tags: ["audit"],
    popularity: 49,
    schemas: {
      sql: `
CREATE TABLE profile_activities (
  id UUID PRIMARY KEY,
  profile_id UUID,
  event VARCHAR(64),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);`,
      nosql: `
{
  "userId": "user_123",
  "activities": [
    { "event": "login", "ts": "2025-07-02T13:00:00Z" }
  ]
}`,
    },
  },

  // settings
  {
    id: "settings-defaults-nosql",
    name: "Workspace Preferences",
    description: "Document workspace defaults and toggle states.",
    category: "settings",
    schemaType: "nosql",
    schema: `
{
  "workspaceId": "ws_001",
  "defaults": {
    "role": "Member",
    "language": "en-US"
  },
  "flags": {
    "beta": true
  }
}`,
    tags: ["workspace", "defaults"],
    popularity: 61,
    schemas: {
      sql: `
CREATE TABLE workspace_preferences (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  defaults JSONB,
  flags JSONB
);`,
      nosql: `
{
  "workspaceId": "ws_001",
  "defaults": {
    "role": "Member",
    "language": "en-US"
  },
  "flags": {
    "beta": true
  }
}`,
    },
  },
  {
    id: "settings-permissions-sql",
    name: "Role Permission Matrix",
    description: "Map roles to feature flags and capabilities.",
    category: "settings",
    schemaType: "sql",
    schema: `
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role VARCHAR(64),
  permission_key TEXT,
  is_enabled BOOLEAN DEFAULT TRUE
);`,
    tags: ["authorization"],
    popularity: 53,
    schemas: {
      sql: `
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role VARCHAR(64),
  permission_key TEXT,
  is_enabled BOOLEAN DEFAULT TRUE
);`,
      nosql: `{
  "permissionId": "perm_01",
  "role": "admin",
  "permissionKey": "generate",
  "isEnabled": true
}`,
    },
  },
  {
    id: "settings-integrations-sql",
    name: "Integration Keys",
    description: "Store external service credentials per user.",
    category: "settings",
    schemaType: "sql",
    schema: `
CREATE TABLE integration_settings (
  id UUID PRIMARY KEY,
  user_id UUID,
  service_name TEXT,
  credentials JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`,
    tags: ["api", "integrations"],
    popularity: 47,
    schemas: {
      sql: `
CREATE TABLE integration_settings (
  id UUID PRIMARY KEY,
  user_id UUID,
  service_name TEXT,
  credentials JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`,
      nosql: `
{
  "integrationId": "int_123",
  "userId": "user_123",
  "serviceName": "Stripe",
  "credentials": { "apiKey": "sk_live" },
  "updatedAt": "2025-07-02T14:00:00Z"
}`,
    },
  },
  {
    id: "settings-audit-nosql",
    name: "Settings Audit Trail",
    description: "Track who changed key configuration fields.",
    category: "settings",
    schemaType: "nosql",
    schema: `
{
  "changeId": "chg_202",
  "changedBy": "admin",
  "timestamp": "2025-07-02T14:00:00Z",
  "details": [
    { "field": "theme", "from": "light", "to": "dark" }
  ]
}`,
    tags: ["audit"],
    popularity: 43,
    schemas: {
      sql: `
CREATE TABLE settings_audit (
  id UUID PRIMARY KEY,
  change_id TEXT,
  changed_by TEXT,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);`,
      nosql: `
{
  "changeId": "chg_202",
  "changedBy": "admin",
  "timestamp": "2025-07-02T14:00:00Z",
  "details": [
    { "field": "theme", "from": "light", "to": "dark" }
  ]
}`,
    },
  },
  {
    id: "settings-workflows-nosql",
    name: "Workflow Settings",
    description: "Define automation workflows tied to settings.",
    category: "settings",
    schemaType: "nosql",
    schema: `
{
  "workflowId": "wf_notify",
  "triggers": ["user.signup"],
  "actions": ["notify_team"]
}`,
    tags: ["automation"],
    popularity: 41,
    schemas: {
      sql: `
CREATE TABLE workflow_settings (
  id UUID PRIMARY KEY,
  workflow_id TEXT,
  triggers TEXT[],
  actions TEXT[]
);`,
      nosql: `
{
  "workflowId": "wf_notify",
  "triggers": ["user.signup"],
  "actions": ["notify_team"]
}`,
    },
  },
  {
    id: "settings-branding-nosql",
    name: "Branding Tokens",
    description: "Store company colors/logos across themes.",
    category: "settings",
    schemaType: "nosql",
    schema: `
{
  "theme": "corporate",
  "colors": {
    "primary": "#5b21b6",
    "accent": "#38bdf8"
  }
}`,
    tags: ["branding"],
    popularity: 39,
    schemas: {
      sql: `
CREATE TABLE branding_tokens (
  id UUID PRIMARY KEY,
  theme VARCHAR(64),
  colors JSONB
);`,
      nosql: `
{
  "theme": "corporate",
  "colors": {
    "primary": "#5b21b6",
    "accent": "#38bdf8"
  }
}`,
    },
  },

  // email
  {
    id: "email-outbox-sql",
    name: "Email Outbox",
    description: "Queue transactional emails with retry state.",
    category: "email",
    schemaType: "sql",
    schema: `
CREATE TABLE email_outbox (
  id UUID PRIMARY KEY,
  to_address VARCHAR(255),
  subject TEXT,
  body TEXT,
  status VARCHAR(16) DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ
);`,
    tags: ["transactional"],
    popularity: 69,
  schemas: {
    sql: `
CREATE TABLE email_outbox (
  id UUID PRIMARY KEY,
  to_address VARCHAR(255),
  subject TEXT,
  body TEXT,
  status VARCHAR(16) DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ
);`,
    nosql: `
{
  "queueId": "email_001",
  "to": "user@example.com",
  "subject": "Welcome",
  "status": "pending",
  "scheduledAt": "2025-07-02T12:00:00Z"
}`,
  },
  },
  {
    id: "email-templates-nosql",
    name: "Email Templates Store",
    description: "Manage subject/body combos with versioning.",
    category: "email",
    schemaType: "nosql",
    schema: `
{
  "templateId": "welcome_v2",
  "subject": "Welcome to MockRG",
  "body": "<p>Hi {{name}}, welcome!</p>",
  "channels": ["email"],
  "version": 2
}`,
    tags: ["marketing"],
    popularity: 73,
  schemas: {
    sql: `
CREATE TABLE email_templates (
  id UUID PRIMARY KEY,
  name TEXT,
  subject TEXT,
  body TEXT,
  channels TEXT[]
);`,
    nosql: `
{
  "templateId": "welcome_v2",
  "subject": "Welcome to MockRG",
  "body": "<p>Hi {{name}}, welcome!</p>",
  "channels": ["email"],
  "version": 2
}`,
  },
  },
  {
    id: "email-digest-sql",
    name: "Digest Rules",
    description: "Schedule cadence/filters for digests.",
    category: "email",
    schemaType: "sql",
    schema: `
CREATE TABLE digest_rules (
  id UUID PRIMARY KEY,
  cadence VARCHAR(32),
  filter JSONB,
  last_sent TIMESTAMPTZ
);`,
    tags: ["automation"],
    popularity: 42,
  schemas: {
    sql: `
CREATE TABLE digest_rules (
  id UUID PRIMARY KEY,
  cadence VARCHAR(32),
  filter JSONB,
  last_sent TIMESTAMPTZ
);`,
    nosql: `
{
  "digestId": "digest_001",
  "cadence": "weekly",
  "recipients": ["team@example.com"]
}`,
  },
  },
  {
    id: "email-verification-sql",
    name: "Verification Tokens",
    description: "Keep track of email verification attempts.",
    category: "email",
    schemaType: "sql",
    schema: `
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY,
  user_id UUID,
  token VARCHAR(255),
  expires_at TIMESTAMPTZ,
  used BOOLEAN DEFAULT FALSE
);`,
    tags: ["security"],
    popularity: 57,
  schemas: {
    sql: `
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY,
  user_id UUID,
  token VARCHAR(255),
  expires_at TIMESTAMPTZ,
  used BOOLEAN DEFAULT FALSE
);`,
    nosql: `
{
  "verificationId": "ver_abc",
  "userId": "user_456",
  "token": "abc123",
  "expiresAt": "2025-07-02T13:00:00Z",
  "used": false
}`,
  },
  },
  {
    id: "email-events-sql",
    name: "Email Event Log",
    description: "Record each email send/delivery/failure event.",
    category: "email",
    schemaType: "sql",
    schema: `
CREATE TABLE email_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(64),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`,
    tags: ["audit"],
    popularity: 44,
  schemas: {
    sql: `
CREATE TABLE email_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(64),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`,
    nosql: `
{
  "eventId": "evt_123",
  "eventType": "sent",
  "metadata": {},
  "createdAt": "2025-07-02T09:30:00Z"
}`,
  },
  },
  {
    id: "email-bounces-sql",
    name: "Bounce Tracking",
    description: "Capture bounce codes and retry counts.",
    category: "email",
    schemaType: "sql",
    schema: `
CREATE TABLE email_bounces (
  id UUID PRIMARY KEY,
  recipient VARCHAR(255),
  reason TEXT,
  last_attempt TIMESTAMPTZ DEFAULT NOW()
);`,
    tags: ["deliverability"],
    popularity: 49,
  schemas: {
    sql: `
CREATE TABLE email_bounces (
  id UUID PRIMARY KEY,
  recipient VARCHAR(255),
  reason TEXT,
  last_attempt TIMESTAMPTZ DEFAULT NOW()
);`,
    nosql: `
{
  "bounceId": "bounce_01",
  "recipient": "user@example.com",
  "reason": "550 5.1.1",
  "lastAttempt": "2025-07-02T09:45:00Z"
}`,
  },
  },

  // messages
  {
    id: "messages-threads-sql",
    name: "Message Threads",
    description: "Store conversation threads and participants.",
    category: "messages",
    schemaType: "sql",
    schema: `
CREATE TABLE threads (
  id UUID PRIMARY KEY,
  title TEXT,
  metadata JSONB
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  thread_id UUID REFERENCES threads(id),
  sender_id UUID,
  content TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);`,
    tags: ["chat"],
    popularity: 61,
    schemas: {
      sql: `
CREATE TABLE threads (
  id UUID PRIMARY KEY,
  title TEXT,
  metadata JSONB
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  thread_id UUID REFERENCES threads(id),
  sender_id UUID,
  content TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);`,
      nosql: `
{
  "threadId": "thread_123",
  "title": "Support Insights",
  "messages": [
    { "id": "msg_1", "senderId": "user_123", "content": "Hello" }
  ]
}`,
    },
  },
  {
    id: "messages-templates-nosql",
    name: "Message Templates",
    description: "Reusable templates for messaging flows.",
    category: "messages",
    schemaType: "nosql",
    schema: `
{
  "templateId": "onboard_msg",
  "content": "Welcome, {{name}}!",
  "channels": ["sms", "push"]
}`,
    tags: ["automation"],
    popularity: 65,
    schemas: {
      sql: `
CREATE TABLE message_templates (
  id UUID PRIMARY KEY,
  name TEXT,
  content TEXT,
  channels TEXT[]
);`,
      nosql: `
{
  "templateId": "onboard_msg",
  "content": "Welcome, {{name}}!",
  "channels": ["sms", "push"]
}`,
    },
  },
  {
    id: "messages-delivery-log-sql",
    name: "Delivery Log",
    description: "When and how messages reached recipients.",
    category: "messages",
    schemaType: "sql",
    schema: `
CREATE TABLE message_logs (
  id UUID PRIMARY KEY,
  message_id UUID,
  channel VARCHAR(16),
  status VARCHAR(16),
  delivered_at TIMESTAMPTZ
);`,
    tags: ["observability"],
    popularity: 52,
    schemas: {
      sql: `
CREATE TABLE message_logs (
  id UUID PRIMARY KEY,
  message_id UUID,
  channel VARCHAR(16),
  status VARCHAR(16),
  delivered_at TIMESTAMPTZ
);`,
      nosql: `
{
  "logId": "log_123",
  "messageId": "msg_123",
  "status": "delivered",
  "deliveredAt": "2025-07-02T09:00:00Z"
}`,
    },
  },
  {
    id: "messages-subscriptions-sql",
    name: "Subscriber Preferences",
    description: "Track opt-in state per channel/contact.",
    category: "messages",
    schemaType: "sql",
    schema: `
CREATE TABLE subscription_preferences (
  id UUID PRIMARY KEY,
  contact_id UUID,
  channel VARCHAR(32),
  status VARCHAR(8)
);`,
    tags: ["compliance"],
    popularity: 47,
    schemas: {
      sql: `
CREATE TABLE subscription_preferences (
  id UUID PRIMARY KEY,
  contact_id UUID,
  channel VARCHAR(32),
  status VARCHAR(8)
);`,
      nosql: `
{
  "preferenceId": "pref_001",
  "contactId": "contact_123",
  "channel": "sms",
  "status": "opted_in"
}`,
    },
  },
  {
    id: "messages-tags-nosql",
    name: "Message Tags",
    description: "Tag sent messages by topic or priority.",
    category: "messages",
    schemaType: "nosql",
    schema: `
{
  "messageId": "msg_123",
  "tags": ["support", "urgent"]
}`,
    tags: ["analytics"],
    popularity: 44,
    schemas: {
      sql: `
CREATE TABLE message_tags (
  id UUID PRIMARY KEY,
  message_id UUID,
  tag VARCHAR(64)
);`,
      nosql: `
{
  "messageId": "msg_123",
  "tags": ["support", "urgent"]
}`,
    },
  },
  {
    id: "messages-playbook-nosql",
    name: "Playbooks",
    description: "Define ordered steps of multi-channel flows.",
    category: "messages",
    schemaType: "nosql",
    schema: `
{
  "playbookId": "welcome",
  "steps": [
    { "channel": "email", "template": "welcome" }
  ]
}`,
    tags: ["automation"],
    popularity: 58,
    schemas: {
      sql: `
CREATE TABLE message_playbooks (
  id UUID PRIMARY KEY,
  name TEXT,
  steps JSONB
);`,
      nosql: `
{
  "playbookId": "welcome",
  "steps": [
    { "channel": "email", "template": "welcome" }
  ]
}`,
    },
  },

  // alerts
  {
    id: "alerts-main-sql",
    name: "Alerts Table",
    description: "Store alerts with severity, owner, and status.",
    category: "alerts",
    schemaType: "sql",
    schema: `
CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  source VARCHAR(128),
  severity VARCHAR(32),
  status VARCHAR(32) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);`,
    tags: ["ops"],
    popularity: 57,
  schemas: {
    sql: `
CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  source VARCHAR(128),
  severity VARCHAR(32),
  status VARCHAR(32) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);`,
    nosql: `{
  "alertId": "alert_001",
  "source": "database",
  "severity": "high",
  "status": "open",
  "createdAt": "2025-07-02T08:00:00Z"
}`,
  },
  },
  {
    id: "alerts-rules-nosql",
    name: "Alert Rules",
    description: "Define trigger rules and escalation steps.",
    category: "alerts",
    schemaType: "nosql",
    schema: `
{
  "ruleId": "high_cpu",
  "condition": { "metric": "cpu.percent", "threshold": 85 },
  "actions": ["notify_slack", "email_team"]
}`,
    tags: ["automation"],
    popularity: 50,
  schemas: {
    sql: `
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY,
  metric VARCHAR(64),
  threshold INT,
  actions TEXT[]
);`,
    nosql: `
{
  "ruleId": "high_cpu",
  "condition": { "metric": "cpu.percent", "threshold": 85 },
  "actions": ["notify_slack", "email_team"]
}`,
  },
  },
  {
    id: "alerts-history-sql",
    name: "Alert History",
    description: "Timeline of acknowledgments and resolutions.",
    category: "alerts",
    schemaType: "sql",
    schema: `
CREATE TABLE alert_history (
  id UUID PRIMARY KEY,
  alert_id UUID REFERENCES alerts(id),
  action VARCHAR(64),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);`,
    tags: ["audit"],
    popularity: 46,
  schemas: {
    sql: `
CREATE TABLE alert_history (
  id UUID PRIMARY KEY,
  alert_id UUID REFERENCES alerts(id),
  action VARCHAR(64),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);`,
    nosql: `
{
  "historyId": "hist_01",
  "alertId": "alert_001",
  "action": "acknowledged",
  "performedAt": "2025-07-02T08:05:00Z"
}`,
  },
  },
  {
    id: "alerts-channels-sql",
    name: "Alert Channels",
    description: "Endpoint definitions for urgency channels.",
    category: "alerts",
    schemaType: "sql",
    schema: `
CREATE TABLE alert_channels (
  id UUID PRIMARY KEY,
  name VARCHAR(64),
  type VARCHAR(32),
  config JSONB,
  enabled BOOLEAN DEFAULT TRUE
);`,
    tags: ["integrations"],
    popularity: 43,
  schemas: {
    sql: `
CREATE TABLE alert_channels (
  id UUID PRIMARY KEY,
  name VARCHAR(64),
  type VARCHAR(32),
  config JSONB,
  enabled BOOLEAN DEFAULT TRUE
);`,
    nosql: `
{
  "channelId": "ch_slack",
  "name": "Slack Ops",
  "type": "slack",
  "config": { "webhookUrl": "https://hooks.slack.com/services/X" },
  "enabled": true
}`,
  },
  },
  {
    id: "alerts-escalation-nosql",
    name: "Escalation Paths",
    description: "Document the escalation path per severity.",
    category: "alerts",
    schemaType: "nosql",
    schema: `
{
  "severity": "critical",
  "path": [
    { "role": "on_call", "delayMinutes": 5 },
    { "role": "team_lead", "delayMinutes": 15 }
  ]
}`,
    tags: ["ops"],
    popularity: 41,
  schemas: {
    sql: `
CREATE TABLE alert_escalations (
  id UUID PRIMARY KEY,
  severity VARCHAR(32),
  roles TEXT[],
  delay_minutes INT[]
);`,
    nosql: `
{
  "severity": "critical",
  "path": [
    { "role": "on_call", "delayMinutes": 5 },
    { "role": "team_lead", "delayMinutes": 15 }
  ]
}`,
  },
  },
  {
    id: "alerts-quarantine-sql",
    name: "Alert Quarantine",
    description: "Temporarily mute noisy alerts for maintenance.",
    category: "alerts",
    schemaType: "sql",
    schema: `
CREATE TABLE alert_quarantine (
  id UUID PRIMARY KEY,
  alert_id UUID REFERENCES alerts(id),
  reason TEXT,
  expires_at TIMESTAMPTZ
);`,
    tags: ["ops"],
    popularity: 39,
  schemas: {
    sql: `
CREATE TABLE alert_quarantine (
  id UUID PRIMARY KEY,
  alert_id UUID REFERENCES alerts(id),
  reason TEXT,
  expires_at TIMESTAMPTZ
);`,
    nosql: `
{
  "quarantineId": "q_001",
  "alertId": "alert_002",
  "reason": "maintenance",
  "expiresAt": "2025-07-02T10:00:00Z"
}`,
  },
  },

  // system
  {
    id: "system-events-sql",
    name: "System Events",
    description: "Captured events for auditing and analytics.",
    category: "system",
    schemaType: "sql",
    schema: `
CREATE TABLE system_events (
  id UUID PRIMARY KEY,
  source VARCHAR(128),
  payload JSONB,
  event_time TIMESTAMPTZ DEFAULT NOW()
);`,
    tags: ["audit"],
    popularity: 64,
  },
  {
    id: "system-metrics-nosql",
    name: "Metrics Snapshot",
    description: "Time series for CPU, memory, and throughput.",
    category: "system",
    schemaType: "nosql",
    schema: `
{
  "metricId": "response_time",
  "values": [
    { "timestamp": "2025-07-02T10:00:00Z", "value": 142 }
  ]
}`,
    tags: ["monitoring"],
    popularity: 58,
  },
  {
    id: "system-config-sql",
    name: "System Config",
    description: "Tenant-specific configuration key/value pairs.",
    category: "system",
    schemaType: "sql",
    schema: `
CREATE TABLE system_config (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  key TEXT,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`,
    tags: ["multi-tenant"],
    popularity: 55,
    schemas: {
      sql: `
CREATE TABLE system_config (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  key TEXT,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`,
      nosql: `
{
  "configId": "cfg_001",
  "tenantId": "tenant_01",
  "key": "maxUsers",
  "value": { "limit": 1000 },
  "updatedAt": "2025-07-02T10:00:00Z"
}`,
    },
  },
  {
    id: "system-incidents-nosql",
    name: "Incident Records",
    description: "Document incidents, owners, and statuses.",
    category: "system",
    schemaType: "nosql",
    schema: `
{
  "incidentId": "inc_123",
  "summary": "Database failover",
  "status": "resolved",
  "owner": "on-call"
}`,
    tags: ["ops"],
    popularity: 50,
    schemas: {
      sql: `
CREATE TABLE system_incidents (
  id UUID PRIMARY KEY,
  summary TEXT,
  status VARCHAR(32),
  owner VARCHAR(64),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`,
      nosql: `
{
  "incidentId": "inc_123",
  "summary": "Database failover",
  "status": "resolved",
  "owner": "on-call"
}`,
    },
  },
  {
    id: "system-maintenance-nosql",
    name: "Maintenance Windows",
    description: "Capture upcoming maintenance for services.",
    category: "system",
    schemaType: "nosql",
    schema: `
{
  "maintenanceId": "mnt_abc",
  "systems": ["api", "db"],
  "startsAt": "2025-07-05T02:00:00Z",
  "durationMinutes": 45
}`,
    tags: ["ops"],
    popularity: 46,
    schemas: {
      sql: `
CREATE TABLE maintenance_windows (
  id UUID PRIMARY KEY,
  title TEXT,
  systems TEXT[],
  starts_at TIMESTAMPTZ,
  duration_minutes INT
);`,
      nosql: `
{
  "maintenanceId": "mnt_abc",
  "systems": ["api", "db"],
  "startsAt": "2025-07-05T02:00:00Z",
  "durationMinutes": 45
}`,
    },
  },
  {
    id: "system-lookup-sql",
    name: "Lookup Helpers",
    description: "Common dimension tables for statuses or severities.",
    category: "system",
    schemaType: "sql",
    schema: `
CREATE TABLE statuses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(32),
  label TEXT
);

CREATE TABLE priorities (
  id SERIAL PRIMARY KEY,
  name TEXT,
  level INT
);`,
    tags: ["dimension"],
    popularity: 36,
    schemas: {
      sql: `
CREATE TABLE statuses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(32),
  label TEXT
);

CREATE TABLE priorities (
  id SERIAL PRIMARY KEY,
  name TEXT,
  level INT
);`,
      nosql: `
{
  "lookupId": "lookup_1",
  "statuses": [
    { "code": "OPEN", "label": "Open" }
  ],
  "priorities": [
    { "name": "High", "level": 1 }
  ]
}`,
    },
  },

  // other
  {
    id: "other-analytics-sql",
    name: "Analytics Snapshot",
    description: "Store analytics tables for ad-hoc reporting.",
    category: "other",
    schemaType: "sql",
    schema: `
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY,
  name TEXT,
  payload JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);`,
    tags: ["analytics"],
    popularity: 33,
    schemas: {
      sql: `
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY,
  name TEXT,
  payload JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);`,
      nosql: `
{
  "snapshotId": "snap_001",
  "name": "Ad-hoc",
  "payload": {},
  "recordedAt": "2025-07-02T09:00:00Z"
}`,
    },
  },
  {
    id: "other-data-lake-nosql",
    name: "Data Lake Document",
    description: "Generic JSON container for rich data capture.",
    category: "other",
    schemaType: "nosql",
    schema: `
{
  "source": "external",
  "payload": {},
  "receivedAt": "2025-07-02T09:00:00Z"
}`,
    tags: ["ingest"],
    popularity: 28,
    schemas: {
      sql: `
CREATE TABLE data_lake (
  id UUID PRIMARY KEY,
  source TEXT,
  payload JSONB,
  received_at TIMESTAMPTZ
);`,
      nosql: `
{
  "source": "external",
  "payload": {},
  "receivedAt": "2025-07-02T09:00:00Z"
}`,
    },
  },
  {
    id: "other-search-index-sql",
    name: "Search Index",
    description: "Pre-processed documents for text search.",
    category: "other",
    schemaType: "sql",
    schema: `
CREATE TABLE search_index (
  id UUID PRIMARY KEY,
  document TEXT,
  keywords TEXT[],
  rank FLOAT
);`,
    tags: ["search"],
    popularity: 26,
    schemas: {
      sql: `
CREATE TABLE search_index (
  id UUID PRIMARY KEY,
  document TEXT,
  keywords TEXT[],
  rank FLOAT
);`,
      nosql: `
{
  "documentId": "doc_001",
  "text": "Sample doc",
  "keywords": ["mock", "data"],
  "rank": 0.95
}`,
    },
  },
  {
    id: "other-rate-limit-sql",
    name: "Rate Limit Counters",
    description: "Track counts per bucket for throttles.",
    category: "other",
    schemaType: "sql",
    schema: `
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY,
  bucket TEXT,
  remaining INT,
  reset_at TIMESTAMPTZ
);`,
    tags: ["throttling"],
    popularity: 29,
    schemas: {
      sql: `
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY,
  bucket TEXT,
  remaining INT,
  reset_at TIMESTAMPTZ
);`,
      nosql: `
{
  "bucket": "login_ipv4",
  "remaining": 9,
  "resetAt": "2025-07-02T10:00:00Z"
}`,
    },
  },
  {
    id: "other-tags-nosql",
    name: "Tags Directory",
    description: "Map tags to descriptions and weight.",
    category: "other",
    schemaType: "nosql",
    schema: `
{
  "tagId": "tag_mock",
  "name": "Mock",
  "weight": 0.8
}`,
    tags: ["taxonomy"],
    popularity: 24,
    schemas: {
      sql: `
CREATE TABLE taxonomy_tags (
  id UUID PRIMARY KEY,
  tag_id TEXT,
  name TEXT,
  weight NUMERIC
);`,
      nosql: `
{
  "tagId": "tag_mock",
  "name": "Mock",
  "weight": 0.8
}`,
    },
  },
  {
    id: "other-geo-sql",
    name: "Geo Points",
    description: "Store geospatial points for mapping.",
    category: "other",
    schemaType: "sql",
    schema: `
CREATE TABLE geo_points (
  id UUID PRIMARY KEY,
  label TEXT,
  coordinates geography(POINT)
);`,
    tags: ["geo"],
    popularity: 31,
    schemas: {
      sql: `
CREATE TABLE geo_points (
  id UUID PRIMARY KEY,
  label TEXT,
  coordinates geography(POINT)
);`,
      nosql: `
{
  "pointId": "pt_abc",
  "label": "HQ",
  "latitude": 39.95,
  "longitude": -75.16
}`,
    },
  },
]

export interface TemplateSearchOptions {
  query?: string
  category?: SchemaTemplateCategory
  tags?: string[]
  schemaType?: "sql" | "nosql"
}

const fuzzyMatch = (value: string | undefined, needle: string) =>
  !!value && value.toLowerCase().includes(needle.toLowerCase())

export function getTemplates(): SchemaTemplate[] {
  return schemaTemplates
}

export function getTemplateById(id: string): SchemaTemplate | undefined {
  return schemaTemplates.find((template) => template.id === id)
}

export function searchTemplates(options: TemplateSearchOptions = {}): SchemaTemplate[] {
  const { query, category, tags, schemaType } = options

  return schemaTemplates.filter((template) => {
    if (category && template.category !== category) {
      return false
    }

    if (schemaType && template.schemaType !== schemaType) {
      return false
    }

    if (tags && tags.length > 0) {
      const matchesTags = tags.every((tag) =>
        template.tags.some((candidate) => candidate.toLowerCase() === tag.toLowerCase())
      )
      if (!matchesTags) {
        return false
      }
    }

    if (query) {
      const needle = query.trim().toLowerCase()
      const matchesQuery =
        fuzzyMatch(template.name, needle) ||
        fuzzyMatch(template.description, needle) ||
        fuzzyMatch(template.schema, needle)
      if (!matchesQuery) {
        return false
      }
    }

    return true
  })
}

