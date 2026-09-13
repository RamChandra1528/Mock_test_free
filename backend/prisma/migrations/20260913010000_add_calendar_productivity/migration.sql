CREATE TABLE `student_calendar_notes` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `date` DATE NOT NULL,
  `title` VARCHAR(120) NOT NULL DEFAULT 'Note',
  `content` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `student_calendar_notes_userId_date_idx`(`userId`, `date`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `student_sticky_notes` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `title` VARCHAR(120) NOT NULL DEFAULT 'Quick note',
  `content` TEXT NOT NULL,
  `color` VARCHAR(20) NOT NULL DEFAULT 'yellow',
  `positionX` INTEGER NOT NULL DEFAULT 0,
  `positionY` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `student_sticky_notes_userId_updatedAt_idx`(`userId`, `updatedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `student_calendar_goals` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `overallTarget` TEXT NULL,
  `longTermGoal` TEXT NULL,
  `shortTermGoal` TEXT NULL,
  `todayGoal` TEXT NULL,
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `student_calendar_goals_userId_key`(`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `student_calendar_tasks` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `description` TEXT NULL,
  `dueDate` DATE NULL,
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
  `completed` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `student_calendar_tasks_userId_dueDate_idx`(`userId`, `dueDate`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `academic_events` (
  `id` CHAR(36) NOT NULL,
  `createdById` CHAR(36) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `eventType` ENUM('EXAM', 'ASSIGNMENT', 'CLASS', 'HOLIDAY', 'ANNOUNCEMENT', 'OTHER') NOT NULL DEFAULT 'OTHER',
  `startAt` DATETIME(3) NOT NULL,
  `endAt` DATETIME(3) NULL,
  `description` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `academic_events_startAt_endAt_idx`(`startAt`, `endAt`),
  INDEX `academic_events_createdById_idx`(`createdById`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `student_calendar_notes`
  ADD CONSTRAINT `student_calendar_notes_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_sticky_notes`
  ADD CONSTRAINT `student_sticky_notes_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_calendar_goals`
  ADD CONSTRAINT `student_calendar_goals_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_calendar_tasks`
  ADD CONSTRAINT `student_calendar_tasks_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `academic_events`
  ADD CONSTRAINT `academic_events_createdById_fkey`
  FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
