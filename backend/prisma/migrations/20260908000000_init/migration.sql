-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `fullName` VARCHAR(120) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `roleId` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_roleId_status_idx`(`roleId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` ENUM('ADMIN', 'STUDENT') NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_statistics` (
    `userId` CHAR(36) NOT NULL,
    `totalAttempts` INTEGER NOT NULL DEFAULT 0,
    `totalQuestions` INTEGER NOT NULL DEFAULT 0,
    `totalCorrect` INTEGER NOT NULL DEFAULT 0,
    `totalWrong` INTEGER NOT NULL DEFAULT 0,
    `averageScore` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    `highestScore` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    `lowestScore` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    `averageAccuracy` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subjects_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `topics` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `subjectId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `topics_subjectId_idx`(`subjectId`),
    UNIQUE INDEX `topics_subjectId_name_key`(`subjectId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exams` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(180) NOT NULL,
    `description` TEXT NULL,
    `instructions` TEXT NULL,
    `categoryId` CHAR(36) NOT NULL,
    `subjectId` CHAR(36) NULL,
    `durationMinutes` INTEGER NOT NULL,
    `totalMarks` DECIMAL(8, 2) NOT NULL,
    `marksPerQuestion` DECIMAL(6, 2) NOT NULL DEFAULT 1,
    `negativeMarks` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `publishedAt` DATETIME(3) NULL,

    INDEX `exams_status_categoryId_idx`(`status`, `categoryId`),
    INDEX `exams_subjectId_idx`(`subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_settings` (
    `examId` CHAR(36) NOT NULL,
    `attemptLimit` INTEGER NULL,
    `randomizeQuestions` BOOLEAN NOT NULL DEFAULT false,
    `randomizeOptions` BOOLEAN NOT NULL DEFAULT false,
    `showResultImmediately` BOOLEAN NOT NULL DEFAULT true,
    `allowAnswerReview` BOOLEAN NOT NULL DEFAULT true,
    `requireExplanations` BOOLEAN NOT NULL DEFAULT false,
    `allowResume` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`examId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_sections` (
    `id` CHAR(36) NOT NULL,
    `examId` CHAR(36) NOT NULL,
    `subjectId` CHAR(36) NULL,
    `name` VARCHAR(120) NOT NULL,
    `order` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exam_sections_examId_idx`(`examId`),
    UNIQUE INDEX `exam_sections_examId_order_key`(`examId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `id` CHAR(36) NOT NULL,
    `examId` CHAR(36) NOT NULL,
    `sectionId` CHAR(36) NULL,
    `subjectId` CHAR(36) NULL,
    `topicId` CHAR(36) NULL,
    `text` TEXT NOT NULL,
    `imageUrl` VARCHAR(500) NULL,
    `explanation` TEXT NULL,
    `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
    `marks` DECIMAL(6, 2) NOT NULL,
    `negativeMarks` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    `order` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `questions_examId_sectionId_idx`(`examId`, `sectionId`),
    INDEX `questions_subjectId_topicId_idx`(`subjectId`, `topicId`),
    UNIQUE INDEX `questions_examId_order_key`(`examId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_options` (
    `id` CHAR(36) NOT NULL,
    `questionId` CHAR(36) NOT NULL,
    `label` VARCHAR(5) NOT NULL,
    `text` TEXT NOT NULL,
    `imageUrl` VARCHAR(500) NULL,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `question_options_questionId_idx`(`questionId`),
    UNIQUE INDEX `question_options_questionId_label_key`(`questionId`, `label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attempts` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `examId` CHAR(36) NOT NULL,
    `attemptNumber` INTEGER NOT NULL,
    `status` ENUM('IN_PROGRESS', 'SUBMITTED', 'EXPIRED') NOT NULL DEFAULT 'IN_PROGRESS',
    `startTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expectedEndTime` DATETIME(3) NOT NULL,
    `submittedAt` DATETIME(3) NULL,
    `currentQuestion` INTEGER NOT NULL DEFAULT 0,
    `timeTakenSeconds` INTEGER NULL,
    `score` DECIMAL(8, 2) NULL,
    `totalMarks` DECIMAL(8, 2) NULL,
    `correctCount` INTEGER NULL,
    `wrongCount` INTEGER NULL,
    `unansweredCount` INTEGER NULL,
    `accuracy` DECIMAL(6, 2) NULL,
    `percentage` DECIMAL(6, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `attempts_userId_status_idx`(`userId`, `status`),
    INDEX `attempts_examId_status_idx`(`examId`, `status`),
    UNIQUE INDEX `attempts_userId_examId_attemptNumber_key`(`userId`, `examId`, `attemptNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attempt_answers` (
    `id` CHAR(36) NOT NULL,
    `attemptId` CHAR(36) NOT NULL,
    `questionId` CHAR(36) NOT NULL,
    `selectedOptionId` CHAR(36) NULL,
    `markedForReview` BOOLEAN NOT NULL DEFAULT false,
    `visited` BOOLEAN NOT NULL DEFAULT true,
    `isCorrect` BOOLEAN NULL,
    `marksAwarded` DECIMAL(6, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `savedAt` DATETIME(3) NOT NULL,

    INDEX `attempt_answers_attemptId_idx`(`attemptId`),
    UNIQUE INDEX `attempt_answers_attemptId_questionId_key`(`attemptId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paper_imports` (
    `id` CHAR(36) NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `storedPath` VARCHAR(500) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `status` ENUM('PROCESSING', 'REVIEW', 'READY', 'FAILED', 'CONFIRMED') NOT NULL DEFAULT 'PROCESSING',
    `uploadedById` CHAR(36) NOT NULL,
    `examId` CHAR(36) NULL,
    `detectedCount` INTEGER NOT NULL DEFAULT 0,
    `warningCount` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `paper_imports_uploadedById_status_idx`(`uploadedById`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `imported_questions` (
    `id` CHAR(36) NOT NULL,
    `importId` CHAR(36) NOT NULL,
    `text` TEXT NOT NULL,
    `optionA` TEXT NULL,
    `optionB` TEXT NULL,
    `optionC` TEXT NULL,
    `optionD` TEXT NULL,
    `correctAnswer` VARCHAR(5) NULL,
    `explanation` TEXT NULL,
    `subjectName` VARCHAR(100) NULL,
    `topicName` VARCHAR(120) NULL,
    `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
    `marks` DECIMAL(6, 2) NOT NULL DEFAULT 1,
    `negativeMarks` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    `warnings` JSON NULL,
    `duplicateOfId` CHAR(36) NULL,
    `duplicateAction` ENUM('KEEP', 'REPLACE', 'SKIP') NOT NULL DEFAULT 'KEEP',
    `status` ENUM('PENDING', 'APPROVED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `order` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `imported_questions_importId_status_idx`(`importId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_statistics` ADD CONSTRAINT `user_statistics_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `topics` ADD CONSTRAINT `topics_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_settings` ADD CONSTRAINT `exam_settings_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_sections` ADD CONSTRAINT `exam_sections_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_sections` ADD CONSTRAINT `exam_sections_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `exam_sections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `topics`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_options` ADD CONSTRAINT `question_options_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attempts` ADD CONSTRAINT `attempts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attempts` ADD CONSTRAINT `attempts_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attempt_answers` ADD CONSTRAINT `attempt_answers_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `attempts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attempt_answers` ADD CONSTRAINT `attempt_answers_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attempt_answers` ADD CONSTRAINT `attempt_answers_selectedOptionId_fkey` FOREIGN KEY (`selectedOptionId`) REFERENCES `question_options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paper_imports` ADD CONSTRAINT `paper_imports_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paper_imports` ADD CONSTRAINT `paper_imports_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `imported_questions` ADD CONSTRAINT `imported_questions_importId_fkey` FOREIGN KEY (`importId`) REFERENCES `paper_imports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
