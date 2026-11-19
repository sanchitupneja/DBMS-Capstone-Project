-- CreateTable
CREATE TABLE `students` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` TEXT NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `course` VARCHAR(191) NOT NULL,
    `yearOfStudy` INTEGER NOT NULL,
    `role` ENUM('STUDENT', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    `profileImageUrl` TEXT NULL,
    `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    `refreshToken` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `students_email_key`(`email`),
    UNIQUE INDEX `students_studentId_key`(`studentId`),
    INDEX `students_email_idx`(`email`),
    INDEX `students_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` TEXT NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `role` ENUM('STUDENT', 'ADMIN') NOT NULL DEFAULT 'ADMIN',
    `refreshToken` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_email_key`(`email`),
    INDEX `admins_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hostels` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `address` VARCHAR(300) NOT NULL,
    `totalRooms` INTEGER NOT NULL DEFAULT 0,
    `availableRooms` INTEGER NOT NULL DEFAULT 0,
    `imageUrl` TEXT NULL,
    `amenities` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `hostels_name_key`(`name`),
    INDEX `hostels_gender_isActive_idx`(`gender`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rooms` (
    `id` VARCHAR(191) NOT NULL,
    `hostelId` VARCHAR(36) NOT NULL,
    `roomNumber` VARCHAR(20) NOT NULL,
    `floor` INTEGER NOT NULL DEFAULT 0,
    `roomType` ENUM('AC', 'NON_AC') NOT NULL,
    `totalBeds` INTEGER NOT NULL,
    `occupiedBeds` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('AVAILABLE', 'PARTIALLY_OCCUPIED', 'FULL', 'UNDER_MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    `pricePerMonth` DOUBLE NOT NULL,
    `amenities` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rooms_hostelId_status_idx`(`hostelId`, `status`),
    INDEX `rooms_hostelId_roomType_status_idx`(`hostelId`, `roomType`, `status`),
    INDEX `rooms_status_idx`(`status`),
    UNIQUE INDEX `rooms_hostelId_roomNumber_key`(`hostelId`, `roomNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `allocation_requests` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(36) NOT NULL,
    `hostelId` VARCHAR(36) NOT NULL,
    `preferredRoomType` ENUM('AC', 'NON_AC') NOT NULL,
    `preferredFloor` INTEGER NULL,
    `specialRequirements` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'WAITLISTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `rejectionReason` TEXT NULL,
    `processedById` VARCHAR(36) NULL,
    `processedAt` DATETIME(3) NULL,
    `academicYear` VARCHAR(20) NOT NULL,
    `semester` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `allocation_requests_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `allocation_requests_hostelId_status_idx`(`hostelId`, `status`),
    INDEX `allocation_requests_studentId_status_idx`(`studentId`, `status`),
    UNIQUE INDEX `allocation_requests_studentId_academicYear_semester_key`(`studentId`, `academicYear`, `semester`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `allocations` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(36) NOT NULL,
    `roomId` VARCHAR(36) NOT NULL,
    `requestId` VARCHAR(36) NOT NULL,
    `allocatedById` VARCHAR(36) NULL,
    `status` ENUM('ACTIVE', 'VACATED', 'TRANSFERRED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `checkInDate` DATETIME(3) NOT NULL,
    `checkOutDate` DATETIME(3) NULL,
    `academicYear` VARCHAR(20) NOT NULL,
    `semester` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `allocations_requestId_key`(`requestId`),
    INDEX `allocations_roomId_status_idx`(`roomId`, `status`),
    INDEX `allocations_studentId_status_idx`(`studentId`, `status`),
    INDEX `allocations_academicYear_semester_idx`(`academicYear`, `semester`),
    UNIQUE INDEX `allocations_studentId_status_academicYear_semester_key`(`studentId`, `status`, `academicYear`, `semester`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_hostelId_fkey` FOREIGN KEY (`hostelId`) REFERENCES `hostels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `allocation_requests` ADD CONSTRAINT `allocation_requests_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `allocation_requests` ADD CONSTRAINT `allocation_requests_hostelId_fkey` FOREIGN KEY (`hostelId`) REFERENCES `hostels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `allocation_requests` ADD CONSTRAINT `allocation_requests_processedById_fkey` FOREIGN KEY (`processedById`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `allocations` ADD CONSTRAINT `allocations_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `allocations` ADD CONSTRAINT `allocations_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `allocations` ADD CONSTRAINT `allocations_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `allocation_requests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `allocations` ADD CONSTRAINT `allocations_allocatedById_fkey` FOREIGN KEY (`allocatedById`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
