-- Add persistent student language preference and optional Hindi translations.
ALTER TABLE `users`
  ADD COLUMN `preferredLanguage` ENUM('EN', 'HI') NOT NULL DEFAULT 'EN';

ALTER TABLE `categories`
  ADD COLUMN `nameHi` VARCHAR(100) NULL;

ALTER TABLE `subjects`
  ADD COLUMN `nameHi` VARCHAR(100) NULL;

ALTER TABLE `topics`
  ADD COLUMN `nameHi` VARCHAR(120) NULL;

ALTER TABLE `exams`
  ADD COLUMN `titleHi` VARCHAR(180) NULL,
  ADD COLUMN `descriptionHi` TEXT NULL,
  ADD COLUMN `instructionsHi` TEXT NULL;

ALTER TABLE `exam_sections`
  ADD COLUMN `nameHi` VARCHAR(120) NULL;

ALTER TABLE `questions`
  ADD COLUMN `textHi` TEXT NULL,
  ADD COLUMN `explanationHi` TEXT NULL;

ALTER TABLE `question_options`
  ADD COLUMN `textHi` TEXT NULL;

ALTER TABLE `imported_questions`
  ADD COLUMN `textHi` TEXT NULL,
  ADD COLUMN `optionAHi` TEXT NULL,
  ADD COLUMN `optionBHi` TEXT NULL,
  ADD COLUMN `optionCHi` TEXT NULL,
  ADD COLUMN `optionDHi` TEXT NULL,
  ADD COLUMN `explanationHi` TEXT NULL,
  ADD COLUMN `subjectNameHi` VARCHAR(100) NULL,
  ADD COLUMN `topicNameHi` VARCHAR(120) NULL;
