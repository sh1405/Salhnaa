CREATE TABLE `mediationInvitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`senderUserId` int NOT NULL,
	`recipientUserId` int,
	`tokenHash` varchar(64) NOT NULL,
	`status` enum('pending_delivery','delivered_inbox','opened','responded','cancelled','expired') NOT NULL,
	`response` enum('accepted','declined'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`openedAt` timestamp,
	`respondedAt` timestamp,
	CONSTRAINT `mediationInvitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `mediationInvitations_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phoneE164` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_phoneE164_unique` UNIQUE(`phoneE164`);--> statement-breakpoint
ALTER TABLE `mediationInvitations` ADD CONSTRAINT `mediationInvitations_caseId_mediationCases_id_fk` FOREIGN KEY (`caseId`) REFERENCES `mediationCases`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mediationInvitations` ADD CONSTRAINT `mediationInvitations_senderUserId_users_id_fk` FOREIGN KEY (`senderUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mediationInvitations` ADD CONSTRAINT `mediationInvitations_recipientUserId_users_id_fk` FOREIGN KEY (`recipientUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `mediation_invitations_sender_created_idx` ON `mediationInvitations` (`senderUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `mediation_invitations_recipient_status_idx` ON `mediationInvitations` (`recipientUserId`,`status`);--> statement-breakpoint
CREATE INDEX `mediation_invitations_expires_idx` ON `mediationInvitations` (`status`,`expiresAt`);