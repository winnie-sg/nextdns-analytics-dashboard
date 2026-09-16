import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  fingerprint: text("fingerprint"),
  apiKey: text("api_key").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(false),
  lastIngestedAt: text("last_ingested_at"),
  lastStreamId: text("last_stream_id"),
  bootstrapStatus: text("bootstrap_status", {
    enum: ["idle", "running", "done", "failed"],
  }).default("idle"),
  bootstrapCursor: text("bootstrap_cursor"),
  bootstrapWindowStart: text("bootstrap_window_start"),
  bootstrapWindowEnd: text("bootstrap_window_end"),
  bootstrapCutoffAt: text("bootstrap_cutoff_at"),
  bootstrapCompletedAt: text("bootstrap_completed_at"),
  lastSuccessfulPollAt: text("last_successful_poll_at"),
  lastSuccessfulStreamAt: text("last_successful_stream_at"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const groups = sqliteTable("groups", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  color: text("color"),
  icon: text("icon"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Keep backward-compatible alias for imports that haven't migrated yet
export const persons = groups;

export const devices = sqliteTable("devices", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id),
  name: text("name").notNull(),
  model: text("model"),
  localIp: text("local_ip"),
  groupId: text("group_id").references(() => groups.id, {
    onDelete: "set null",
  }),
  lastSeenAt: text("last_seen_at"),
  offlineNotifiedAt: text("offline_notified_at"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_devices_last_seen_at").on(table.lastSeenAt),
]);

export const dnsLogs = sqliteTable(
  "dns_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id),
    eventHash: text("event_hash").notNull(),
    deviceId: text("device_id").references(() => devices.id),
    deviceName: text("device_name"),
    deviceModel: text("device_model"),
    deviceLocalIp: text("device_local_ip"),
    timestamp: text("timestamp").notNull(),
    domain: text("domain").notNull(),
    rootDomain: text("root_domain"),
    tracker: text("tracker"),
    status: text("status", {
      enum: ["default", "blocked", "allowed", "relayed", "error"],
    }).notNull(),
    queryType: text("query_type"),
    dnssec: integer("dnssec", { mode: "boolean" }),
    encrypted: integer("encrypted", { mode: "boolean" }).default(false),
    protocol: text("protocol"),
    clientIp: text("client_ip"),
    clientName: text("client_name"),
    isFlagged: integer("is_flagged", { mode: "boolean" }).default(false),
    flagReason: text("flag_reason"),
    reasons: text("reasons", { mode: "json" }),
    ingestedAt: text("ingested_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_dns_logs_event_hash").on(table.profileId, table.eventHash),
    index("idx_dns_logs_timestamp").on(table.timestamp),
    index("idx_dns_logs_profile_timestamp").on(
      table.profileId,
      table.timestamp
    ),
    index("idx_dns_logs_domain").on(table.domain),
    index("idx_dns_logs_device").on(table.deviceId),
    index("idx_dns_logs_status").on(table.status),
    index("idx_dns_logs_flagged").on(table.isFlagged),
  ]
);

export const alertTags = sqliteTable(
  "alert_tags",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    color: text("color"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_alert_tags_name").on(table.name),
    uniqueIndex("idx_alert_tags_slug").on(table.slug),
  ]
);

export const tags = alertTags;

export const domainLists = sqliteTable(
  "domain_lists",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    tagId: text("tag_id")
      .notNull()
      .references(() => alertTags.id),
    sourceType: text("source_type", { enum: ["builtin", "github_raw"] }).notNull(),
    sourceUrl: text("source_url"),
    isSystem: integer("is_system", { mode: "boolean" }).default(false),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    lastFetchedAt: text("last_fetched_at"),
    lastFetchStatus: text("last_fetch_status", {
      enum: ["idle", "success", "error"],
    }).default("idle"),
    lastFetchError: text("last_fetch_error"),
    entryCount: integer("entry_count").default(0),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_domain_lists_tag_id").on(table.tagId)]
);

export const domainListEntries = sqliteTable(
  "domain_list_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    listId: text("list_id")
      .notNull()
      .references(() => domainLists.id),
    domain: text("domain").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_domain_list_entries_unique").on(table.listId, table.domain),
    index("idx_domain_list_entries_domain").on(table.domain),
  ]
);

export const dnsLogTags = sqliteTable(
  "dns_log_tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    logId: integer("log_id")
      .notNull()
      .references(() => dnsLogs.id),
    tagId: text("tag_id")
      .notNull()
      .references(() => alertTags.id),
    listId: text("list_id")
      .notNull()
      .references(() => domainLists.id),
    matchedDomain: text("matched_domain").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_dns_log_tags_unique").on(
      table.logId,
      table.tagId,
      table.listId,
      table.matchedDomain
    ),
    index("idx_dns_log_tags_log_id").on(table.logId),
    index("idx_dns_log_tags_tag_id").on(table.tagId),
  ]
);

export const webhooks = sqliteTable("webhooks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  url: text("url").notNull(),
  secret: text("secret"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  triggers: text("triggers", { mode: "json" }).notNull(),
  cooldownMinutes: integer("cooldown_minutes").default(5),
  deviceGapSeconds: integer("device_gap_seconds"),
  groupId: text("group_id").references(() => groups.id),
  lastTriggeredAt: text("last_triggered_at"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const webhookTags = sqliteTable(
  "webhook_tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    webhookId: text("webhook_id")
      .notNull()
      .references(() => webhooks.id),
    tagId: text("tag_id")
      .notNull()
      .references(() => alertTags.id),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_webhook_tags_unique").on(table.webhookId, table.tagId),
    index("idx_webhook_tags_webhook_id").on(table.webhookId),
    index("idx_webhook_tags_tag_id").on(table.tagId),
  ]
);

export const webhookDevices = sqliteTable(
  "webhook_devices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    webhookId: text("webhook_id")
      .notNull()
      .references(() => webhooks.id, { onDelete: "cascade" }),
    deviceId: text("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_webhook_devices_unique").on(table.webhookId, table.deviceId),
    index("idx_webhook_devices_webhook_id").on(table.webhookId),
    index("idx_webhook_devices_device_id").on(table.deviceId),
  ]
);

export const analyticsSnapshots = sqliteTable(
  "analytics_snapshots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id),
    snapshotDate: text("snapshot_date").notNull(),
    period: text("period").notNull(),
    type: text("type").notNull(),
    data: text("data", { mode: "json" }).notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_snapshot_unique").on(
      table.profileId,
      table.snapshotDate,
      table.period,
      table.type
    ),
  ]
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
// Backward-compat aliases
export type Person = Group;
export type NewPerson = NewGroup;
export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
export type DnsLog = typeof dnsLogs.$inferSelect;
export type NewDnsLog = typeof dnsLogs.$inferInsert;
export type Tag = typeof alertTags.$inferSelect;
export type NewTag = typeof alertTags.$inferInsert;
export type AlertTag = Tag;
export type NewAlertTag = NewTag;
export type DomainList = typeof domainLists.$inferSelect;
export type NewDomainList = typeof domainLists.$inferInsert;
export type DomainListEntry = typeof domainListEntries.$inferSelect;
export type NewDomainListEntry = typeof domainListEntries.$inferInsert;
export type DnsLogTag = typeof dnsLogTags.$inferSelect;
export type NewDnsLogTag = typeof dnsLogTags.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type WebhookTag = typeof webhookTags.$inferSelect;
export type NewWebhookTag = typeof webhookTags.$inferInsert;
export type WebhookDevice = typeof webhookDevices.$inferSelect;
export type NewWebhookDevice = typeof webhookDevices.$inferInsert;
export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type Setting = typeof settings.$inferSelect;
