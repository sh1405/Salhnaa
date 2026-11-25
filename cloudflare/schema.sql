PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openId TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  phoneE164 TEXT UNIQUE,
  loginMethod TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  lastSignedIn TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS mediationCases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,
  country TEXT NOT NULL,
  safety TEXT NOT NULL CHECK (safety IN ('safe', 'danger', 'unsure', 'prefer_not')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'paused')),
  responses TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS mediation_cases_user_updated_idx
  ON mediationCases(userId, updatedAt);

CREATE TABLE IF NOT EXISTS mediationInvitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caseId INTEGER NOT NULL REFERENCES mediationCases(id) ON DELETE CASCADE,
  senderUserId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipientUserId INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tokenHash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending_delivery', 'delivered_inbox', 'opened', 'responded', 'cancelled', 'expired')),
  response TEXT CHECK (response IN ('accepted', 'declined') OR response IS NULL),
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expiresAt TEXT NOT NULL,
  openedAt TEXT,
  respondedAt TEXT
);
CREATE INDEX IF NOT EXISTS mediation_invitations_sender_created_idx
  ON mediationInvitations(senderUserId, createdAt);
CREATE INDEX IF NOT EXISTS mediation_invitations_recipient_status_idx
  ON mediationInvitations(recipientUserId, status);
CREATE INDEX IF NOT EXISTS mediation_invitations_expires_idx
  ON mediationInvitations(status, expiresAt);
