CREATE TABLE `mediationCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kind` varchar(100) NOT NULL,
	`country` varchar(100) NOT NULL,
	`safety` enum('safe','danger','unsure','prefer_not') NOT NULL,
	`status` enum('draft','paused') NOT NULL,
	`responses` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mediationCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mediationCases` ADD CONSTRAINT `mediationCases_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `mediation_cases_user_updated_idx` ON `mediationCases` (`userId`,`updatedAt`);