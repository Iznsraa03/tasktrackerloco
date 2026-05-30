-- CreateTable
CREATE TABLE `employees` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `birthDate` VARCHAR(191) NOT NULL,
    `division` ENUM('Operation', 'Admin & Finance', 'Marketing', 'Creative & Program') NOT NULL,
    `jobTitle` VARCHAR(191) NOT NULL,
    `role` ENUM('Admin', 'Manager', 'Karyawan') NOT NULL DEFAULT 'Karyawan',
    `status` ENUM('Aktif', 'Menunggu') NOT NULL DEFAULT 'Menunggu',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employees_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `client` VARCHAR(191) NOT NULL,
    `startDate` VARCHAR(191) NOT NULL,
    `endDate` VARCHAR(191) NOT NULL,
    `venue` VARCHAR(191) NOT NULL,
    `status` ENUM('Fix', 'Pitching', 'Pending', 'Cancel') NOT NULL DEFAULT 'Pitching',
    `projectOfficer` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `projects_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tasks` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('To Do', 'In Progress', 'Revisi', 'Done', 'Approved') NOT NULL DEFAULT 'To Do',
    `priority` ENUM('High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
    `taskType` ENUM('Core', 'Support', 'Colaboration', 'Improvement') NOT NULL DEFAULT 'Core',
    `partner` VARCHAR(191) NOT NULL DEFAULT '',
    `date` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL DEFAULT '',
    `resultLink` VARCHAR(191) NOT NULL DEFAULT '',
    `resultFile` VARCHAR(191) NOT NULL DEFAULT '',
    `revisionCount` INTEGER NOT NULL DEFAULT 0,
    `revisionNotes` TEXT NOT NULL,
    `approvedBy` JSON NOT NULL,
    `completedAt` VARCHAR(191) NULL,
    `assigneeId` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_partnerId_fkey` FOREIGN KEY (`partnerId`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
