CREATE TABLE `profiles` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `fingerprint` text,
  `api_key` text NOT NULL,
  `is_active` integer DEFAULT false,
  `last_ingested_at` text,
  `last_stream_id` text,
  `bootstrap_status` text DEFAULT 'idle',
  `bootstrap_cursor` text,
  `bootstrap_window_start` text,
  `bootstrap_window_end` text,
  `bootstrap_cutoff_at` text,
  `bootstrap_completed_at` text,
  `last_successful_poll_at` text,
  `last_successful_stream_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `groups` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `color` text,
  `icon` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `devices` (
  `id` text PRIMARY KEY NOT NULL,
  `profile_id` text NOT NULL,
  `name` text NOT NULL,
  `model` text,
  `local_ip` text,
  `group_id` text,
  `last_seen_at` text,
  `offline_notified_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_devices_last_seen_at` ON `devices` (`last_seen_at`);
--> statement-breakpoint
CREATE TABLE `dns_logs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `profile_id` text NOT NULL,
  `event_hash` text NOT NULL,
  `device_id` text,
  `device_name` text,
  `device_model` text,
  `device_local_ip` text,
  `timestamp` text NOT NULL,
  `domain` text NOT NULL,
  `root_domain` text,
  `tracker` text,
  `status` text NOT NULL,
  `query_type` text,
  `dnssec` integer,
  `encrypted` integer DEFAULT false,
  `protocol` text,
  `client_ip` text,
  `client_name` text,
  `is_flagged` integer DEFAULT false,
  `flag_reason` text,
  `reasons` text,
  `ingested_at` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_dns_logs_event_hash` ON `dns_logs` (`profile_id`,`event_hash`);
--> statement-breakpoint
CREATE INDEX `idx_dns_logs_timestamp` ON `dns_logs` (`timestamp`);
--> statement-breakpoint
CREATE INDEX `idx_dns_logs_profile_timestamp` ON `dns_logs` (`profile_id`,`timestamp`);
--> statement-breakpoint
CREATE INDEX `idx_dns_logs_domain` ON `dns_logs` (`domain`);
--> statement-breakpoint
CREATE INDEX `idx_dns_logs_device` ON `dns_logs` (`device_id`);
--> statement-breakpoint
CREATE INDEX `idx_dns_logs_status` ON `dns_logs` (`status`);
--> statement-breakpoint
CREATE INDEX `idx_dns_logs_flagged` ON `dns_logs` (`is_flagged`);
--> statement-breakpoint
CREATE TABLE `alert_tags` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `color` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_alert_tags_name` ON `alert_tags` (`name`);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_alert_tags_slug` ON `alert_tags` (`slug`);
--> statement-breakpoint
CREATE TABLE `domain_lists` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `tag_id` text NOT NULL,
  `source_type` text NOT NULL,
  `source_url` text,
  `is_system` integer DEFAULT false,
  `is_active` integer DEFAULT true,
  `last_fetched_at` text,
  `last_fetch_status` text DEFAULT 'idle',
  `last_fetch_error` text,
  `entry_count` integer DEFAULT 0,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tag_id`) REFERENCES `alert_tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_domain_lists_tag_id` ON `domain_lists` (`tag_id`);
--> statement-breakpoint
CREATE TABLE `domain_list_entries` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `list_id` text NOT NULL,
  `domain` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`list_id`) REFERENCES `domain_lists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_domain_list_entries_unique` ON `domain_list_entries` (`list_id`,`domain`);
--> statement-breakpoint
CREATE INDEX `idx_domain_list_entries_domain` ON `domain_list_entries` (`domain`);
--> statement-breakpoint
CREATE TABLE `dns_log_tags` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `log_id` integer NOT NULL,
  `tag_id` text NOT NULL,
  `list_id` text NOT NULL,
  `matched_domain` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`log_id`) REFERENCES `dns_logs`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`tag_id`) REFERENCES `alert_tags`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`list_id`) REFERENCES `domain_lists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_dns_log_tags_unique` ON `dns_log_tags` (`log_id`,`tag_id`,`list_id`,`matched_domain`);
--> statement-breakpoint
CREATE INDEX `idx_dns_log_tags_log_id` ON `dns_log_tags` (`log_id`);
--> statement-breakpoint
CREATE INDEX `idx_dns_log_tags_tag_id` ON `dns_log_tags` (`tag_id`);
--> statement-breakpoint
CREATE TABLE `webhooks` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `url` text NOT NULL,
  `secret` text,
  `is_active` integer DEFAULT true,
  `triggers` text NOT NULL,
  `cooldown_minutes` integer DEFAULT 5,
  `device_gap_seconds` integer,
  `group_id` text,
  `last_triggered_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `webhook_tags` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `webhook_id` text NOT NULL,
  `tag_id` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`tag_id`) REFERENCES `alert_tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_webhook_tags_unique` ON `webhook_tags` (`webhook_id`,`tag_id`);
--> statement-breakpoint
CREATE INDEX `idx_webhook_tags_webhook_id` ON `webhook_tags` (`webhook_id`);
--> statement-breakpoint
CREATE INDEX `idx_webhook_tags_tag_id` ON `webhook_tags` (`tag_id`);
--> statement-breakpoint
CREATE TABLE `webhook_devices` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `webhook_id` text NOT NULL,
  `device_id` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_webhook_devices_unique` ON `webhook_devices` (`webhook_id`,`device_id`);
--> statement-breakpoint
CREATE INDEX `idx_webhook_devices_webhook_id` ON `webhook_devices` (`webhook_id`);
--> statement-breakpoint
CREATE INDEX `idx_webhook_devices_device_id` ON `webhook_devices` (`device_id`);
--> statement-breakpoint
CREATE TABLE `analytics_snapshots` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `profile_id` text NOT NULL,
  `snapshot_date` text NOT NULL,
  `period` text NOT NULL,
  `type` text NOT NULL,
  `data` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_snapshot_unique` ON `analytics_snapshots` (`profile_id`,`snapshot_date`,`period`,`type`);
--> statement-breakpoint
CREATE TABLE `settings` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP
);
