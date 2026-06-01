/*
  Warnings:

  - You are about to drop the column `division` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `projectOfficer` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `approvedBy` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `partner` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `revisionNotes` on the `tasks` table. All the data in the column will be lost.
  - Added the required column `divisionId` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleId` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `employees` DROP COLUMN `division`,
    DROP COLUMN `role`,
    ADD COLUMN `divisionId` VARCHAR(191) NOT NULL,
    ADD COLUMN `roleId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `projects` DROP COLUMN `projectOfficer`,
    ADD COLUMN `projectOfficerId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `tasks` DROP COLUMN `approvedBy`,
    DROP COLUMN `partner`,
    DROP COLUMN `revisionNotes`;

-- CreateTable
CREATE TABLE `divisions` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `divisions_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_approvals` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `divisionId` VARCHAR(191) NOT NULL,
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `task_approvals_taskId_divisionId_key`(`taskId`, `divisionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_revisions` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `revisionNumber` INTEGER NOT NULL,
    `notes` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_divisionId_fkey` FOREIGN KEY (`divisionId`) REFERENCES `divisions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_projectOfficerId_fkey` FOREIGN KEY (`projectOfficerId`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_approvals` ADD CONSTRAINT `task_approvals_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_approvals` ADD CONSTRAINT `task_approvals_divisionId_fkey` FOREIGN KEY (`divisionId`) REFERENCES `divisions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_approvals` ADD CONSTRAINT `task_approvals_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_revisions` ADD CONSTRAINT `task_revisions_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
