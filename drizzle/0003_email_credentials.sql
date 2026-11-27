CREATE TABLE `emailCredentials` (
	`userId` int NOT NULL,
	`emailNormalized` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailCredentials_userId` PRIMARY KEY(`userId`),
	CONSTRAINT `emailCredentials_emailNormalized_unique` UNIQUE(`emailNormalized`)
);
--> statement-breakpoint
ALTER TABLE `emailCredentials` ADD CONSTRAINT `emailCredentials_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;