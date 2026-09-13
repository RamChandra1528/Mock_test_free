ALTER TABLE `user_statistics`
  ADD COLUMN `points` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `currentStreak` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `longestStreak` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `lastRewardDate` DATE NULL;

CREATE TABLE `student_daily_login_rewards` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `rewardDate` DATE NOT NULL,
  `points` INTEGER NOT NULL DEFAULT 10,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `student_daily_login_rewards_userId_rewardDate_key`(`userId`, `rewardDate`),
  INDEX `student_daily_login_rewards_rewardDate_idx`(`rewardDate`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `student_daily_login_rewards`
  ADD CONSTRAINT `student_daily_login_rewards_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
