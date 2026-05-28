-- CreateTable
CREATE TABLE `areas` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `areas_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periodos` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `fecha_inicio` DATETIME(3) NOT NULL,
    `fecha_fin` DATETIME(3) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `encuesta_configs` (
    `id` VARCHAR(191) NOT NULL,
    `periodo_id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `tipo` ENUM('ANONIMA', 'NOMINAL') NOT NULL,
    `escala_labels` TEXT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupos` (
    `id` VARCHAR(191) NOT NULL,
    `encuesta_config_id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sub_grupos` (
    `id` VARCHAR(191) NOT NULL,
    `grupo_id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admins_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `temas` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trabajadores` (
    `id` VARCHAR(191) NOT NULL,
    `cedula` VARCHAR(191) NOT NULL,
    `nombres` VARCHAR(191) NOT NULL,
    `apellidos` VARCHAR(191) NOT NULL,
    `area` VARCHAR(191) NOT NULL DEFAULT 'Sin asignar',
    `area_id` VARCHAR(191) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `trabajadores_cedula_key`(`cedula`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `preguntas` (
    `id` VARCHAR(191) NOT NULL,
    `enunciado` TEXT NOT NULL,
    `respuesta_correcta` BOOLEAN NULL,
    `puntos` INTEGER NOT NULL DEFAULT 10,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `tema_id` VARCHAR(191) NULL,
    `tipo_pregunta` ENUM('VERDADERO_FALSO', 'LIKERT_3') NOT NULL DEFAULT 'VERDADERO_FALSO',
    `grupo_id` VARCHAR(191) NULL,
    `sub_grupo_id` VARCHAR(191) NULL,
    `encuesta_config_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `premios` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#6366f1',
    `probabilidad` DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `encuestas_sesiones` (
    `id` VARCHAR(191) NOT NULL,
    `trabajador_id` VARCHAR(191) NULL,
    `tema_id` VARCHAR(191) NULL,
    `periodo_id` VARCHAR(191) NULL,
    `encuesta_config_id` VARCHAR(191) NULL,
    `anon_token` VARCHAR(36) NULL,
    `fecha_inicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_fin` DATETIME(3) NULL,
    `puntaje_total` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `encuestas_sesiones_anon_token_key`(`anon_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `respuestas` (
    `id` VARCHAR(191) NOT NULL,
    `sesion_id` VARCHAR(191) NOT NULL,
    `pregunta_id` VARCHAR(191) NOT NULL,
    `respuesta_dada` BOOLEAN NULL,
    `valor_numerico` INTEGER NULL,
    `es_correcta` BOOLEAN NOT NULL,
    `puntos_obtenidos` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resultados_ruleta` (
    `id` VARCHAR(191) NOT NULL,
    `sesion_id` VARCHAR(191) NOT NULL,
    `premio_id` VARCHAR(191) NOT NULL,
    `obtenido_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `resultados_ruleta_sesion_id_key`(`sesion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `encuesta_configs` ADD CONSTRAINT `encuesta_configs_periodo_id_fkey` FOREIGN KEY (`periodo_id`) REFERENCES `periodos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupos` ADD CONSTRAINT `grupos_encuesta_config_id_fkey` FOREIGN KEY (`encuesta_config_id`) REFERENCES `encuesta_configs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_grupos` ADD CONSTRAINT `sub_grupos_grupo_id_fkey` FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trabajadores` ADD CONSTRAINT `trabajadores_area_id_fkey` FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `preguntas` ADD CONSTRAINT `preguntas_tema_id_fkey` FOREIGN KEY (`tema_id`) REFERENCES `temas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `preguntas` ADD CONSTRAINT `preguntas_grupo_id_fkey` FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `preguntas` ADD CONSTRAINT `preguntas_sub_grupo_id_fkey` FOREIGN KEY (`sub_grupo_id`) REFERENCES `sub_grupos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `encuestas_sesiones` ADD CONSTRAINT `encuestas_sesiones_trabajador_id_fkey` FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `encuestas_sesiones` ADD CONSTRAINT `encuestas_sesiones_tema_id_fkey` FOREIGN KEY (`tema_id`) REFERENCES `temas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `encuestas_sesiones` ADD CONSTRAINT `encuestas_sesiones_periodo_id_fkey` FOREIGN KEY (`periodo_id`) REFERENCES `periodos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `encuestas_sesiones` ADD CONSTRAINT `encuestas_sesiones_encuesta_config_id_fkey` FOREIGN KEY (`encuesta_config_id`) REFERENCES `encuesta_configs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `respuestas` ADD CONSTRAINT `respuestas_sesion_id_fkey` FOREIGN KEY (`sesion_id`) REFERENCES `encuestas_sesiones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `respuestas` ADD CONSTRAINT `respuestas_pregunta_id_fkey` FOREIGN KEY (`pregunta_id`) REFERENCES `preguntas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resultados_ruleta` ADD CONSTRAINT `resultados_ruleta_sesion_id_fkey` FOREIGN KEY (`sesion_id`) REFERENCES `encuestas_sesiones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resultados_ruleta` ADD CONSTRAINT `resultados_ruleta_premio_id_fkey` FOREIGN KEY (`premio_id`) REFERENCES `premios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
