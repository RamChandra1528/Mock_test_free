CREATE TABLE `study_materials` (
  `id` CHAR(36) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `description` TEXT NULL,
  `exam` VARCHAR(100) NULL,
  `fileUrl` VARCHAR(500) NOT NULL,
  `fileName` VARCHAR(255) NOT NULL,
  `published` BOOLEAN NOT NULL DEFAULT false,
  `createdById` CHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `study_materials_published_exam_idx`(`published`, `exam`),
  INDEX `study_materials_createdById_idx`(`createdById`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `study_materials`
  ADD CONSTRAINT `study_materials_createdById_fkey`
  FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
