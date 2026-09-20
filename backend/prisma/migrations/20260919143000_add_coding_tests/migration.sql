CREATE TABLE `coding_problems` (
  `id` CHAR(36) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `description` TEXT NOT NULL,
  `inputFormat` TEXT NULL,
  `outputFormat` TEXT NULL,
  `constraints` TEXT NULL,
  `starterCode` LONGTEXT NOT NULL,
  `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
  `durationMinutes` INTEGER NOT NULL DEFAULT 30,
  `testCases` JSON NOT NULL,
  `published` BOOLEAN NOT NULL DEFAULT false,
  `createdById` CHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `coding_problems_published_difficulty_idx`(`published`, `difficulty`),
  INDEX `coding_problems_createdById_idx`(`createdById`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `coding_submissions` (
  `id` CHAR(36) NOT NULL,
  `problemId` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `sourceCode` LONGTEXT NOT NULL,
  `status` ENUM('ACCEPTED', 'WRONG_ANSWER', 'RUNTIME_ERROR', 'TIME_LIMIT') NOT NULL,
  `passedCases` INTEGER NOT NULL,
  `totalCases` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `coding_submissions_problemId_userId_createdAt_idx`(`problemId`, `userId`, `createdAt`),
  INDEX `coding_submissions_userId_createdAt_idx`(`userId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `coding_problems`
  ADD CONSTRAINT `coding_problems_createdById_fkey`
  FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `coding_submissions`
  ADD CONSTRAINT `coding_submissions_problemId_fkey`
  FOREIGN KEY (`problemId`) REFERENCES `coding_problems`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `coding_submissions_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
