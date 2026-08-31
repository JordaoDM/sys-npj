-- ========================================
-- Estrutura Completa do Banco NPJ Database
-- Sistema NPJ - Núcleo de Prática Jurídica
-- ========================================

SET FOREIGN_KEY_CHECKS = 0;

SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ========================================
-- TABELA ROLES
-- ========================================

CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `descricao` text,
  `permissoes` json DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========================================
-- TABELA USUARIOS
-- ========================================

CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `role_id` int NOT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ativo` tinyint(1) DEFAULT '1',
  `telefone` varchar(20) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `usuarios_ibfk_1`
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========================================
-- TABELAS AUXILIARES
-- ========================================

CREATE TABLE `diligencia` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `diligencia_nome_unique` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `fase` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fase_nome_unique` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `local_tramitacao` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `materia_assunto` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `materia_assunto_nome_unique` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========================================
-- PROCESSOS
-- ========================================

CREATE TABLE `processos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero_processo` varchar(50) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(30) DEFAULT NULL,
  `tipo_processo` varchar(50) DEFAULT NULL,
  `idusuario_responsavel` int DEFAULT NULL,
  `data_encerramento` timestamp NULL DEFAULT NULL,
  `observacoes` text,
  `sistema` enum('Fisico','PEA','PJE') DEFAULT 'Fisico',
  `materia_assunto_id` int unsigned DEFAULT NULL,
  `fase_id` int unsigned DEFAULT NULL,
  `diligencia_id` int unsigned DEFAULT NULL,
  `num_processo_sei` varchar(100) DEFAULT NULL,
  `assistido` varchar(100) DEFAULT NULL,
  `contato_assistido` varchar(255) DEFAULT NULL,
  `local_tramitacao_id` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  UNIQUE KEY `numero_processo` (`numero_processo`),

  KEY `processos_idusuario_responsavel_foreign` (`idusuario_responsavel`),
  KEY `processos_materia_assunto_id_foreign` (`materia_assunto_id`),
  KEY `processos_fase_id_foreign` (`fase_id`),
  KEY `processos_diligencia_id_foreign` (`diligencia_id`),
  KEY `processos_local_tramitacao_id_foreign_idx` (`local_tramitacao_id`),

  CONSTRAINT `processos_diligencia_id_foreign`
    FOREIGN KEY (`diligencia_id`) REFERENCES `diligencia` (`id`),

  CONSTRAINT `processos_fase_id_foreign`
    FOREIGN KEY (`fase_id`) REFERENCES `fase` (`id`),

  CONSTRAINT `processos_idusuario_responsavel_foreign`
    FOREIGN KEY (`idusuario_responsavel`)
    REFERENCES `usuarios` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT `processos_local_tramitacao_id_foreign_idx`
    FOREIGN KEY (`local_tramitacao_id`)
    REFERENCES `local_tramitacao` (`id`)
    ON DELETE SET NULL,

  CONSTRAINT `processos_materia_assunto_id_foreign`
    FOREIGN KEY (`materia_assunto_id`)
    REFERENCES `materia_assunto` (`id`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========================================
-- AGENDAMENTOS
-- ========================================

CREATE TABLE `agendamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `processo_id` int DEFAULT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text,
  `data_inicio` datetime NOT NULL,
  `data_fim` datetime NOT NULL,
  `local` varchar(500) DEFAULT NULL,

  `tipo` enum('reuniao','audiencia','prazo','outro')
    NOT NULL DEFAULT 'reuniao',

  `status` enum(
    'em_analise',
    'pendente',
    'enviando_convites',
    'marcado',
    'cancelado',
    'finalizado'
  ) NOT NULL DEFAULT 'em_analise',

  `email_lembrete` varchar(255) DEFAULT NULL,
  `lembrete_enviado` tinyint(1) NOT NULL DEFAULT '0',
  `criado_por` int NOT NULL,
  `observacoes` text,

  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  `convidados` json DEFAULT NULL,
  `motivo_recusa` text,
  `aprovado_por` int DEFAULT NULL,
  `data_aprovacao` datetime DEFAULT NULL,
  `lembrete_1h_enviado` tinyint(1) NOT NULL DEFAULT '0',
  `cancelado_automaticamente` tinyint(1) NOT NULL DEFAULT '0',
  `motivo_cancelamento` text,
  `situacao_mista` tinyint(1) NOT NULL DEFAULT '0',
  `data_convites_enviados` datetime DEFAULT NULL,
  `admin_notificado_rejeicoes` tinyint(1) DEFAULT '0',
  `cancelado_por` int DEFAULT NULL,

  PRIMARY KEY (`id`),

  KEY `idx_agendamentos_processo` (`processo_id`),
  KEY `idx_agendamentos_periodo` (`data_inicio`,`data_fim`),
  KEY `idx_agendamentos_status` (`status`),
  KEY `idx_agendamentos_usuario` (`criado_por`),
  KEY `agendamentos_aprovado_por_foreign_idx` (`aprovado_por`),

  CONSTRAINT `agendamentos_aprovado_por_foreign_idx`
    FOREIGN KEY (`aprovado_por`) REFERENCES `usuarios` (`id`),

  CONSTRAINT `agendamentos_ibfk_1`
    FOREIGN KEY (`processo_id`)
    REFERENCES `processos` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `agendamentos_ibfk_2`
    FOREIGN KEY (`criado_por`)
    REFERENCES `usuarios` (`id`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========================================
-- ARQUIVOS
-- ========================================

CREATE TABLE `arquivos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `nome_original` varchar(255) NOT NULL,
  `caminho` varchar(255) NOT NULL,
  `tamanho` int NOT NULL,
  `tipo` varchar(255) NOT NULL,
  `processo_id` int DEFAULT NULL,
  `usuario_id` int NOT NULL,
  `ativo` tinyint(1) DEFAULT '1',

  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  `descricao` text,

  PRIMARY KEY (`id`),

  KEY `arquivos_processo_id_foreign` (`processo_id`),
  KEY `arquivos_usuario_id_foreign` (`usuario_id`),

  CONSTRAINT `arquivos_processo_id_foreign`
    FOREIGN KEY (`processo_id`)
    REFERENCES `processos` (`id`)
    ON DELETE SET NULL,

  CONSTRAINT `arquivos_usuario_id_foreign`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========================================
-- ATUALIZACOES PROCESSO
-- ========================================

CREATE TABLE `atualizacoes_processo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `processo_id` int NOT NULL,
  `arquivos_id` int unsigned DEFAULT NULL,
  `data_atualizacao` datetime NOT NULL,
  `tipo_atualizacao` varchar(255) NOT NULL,
  `descricao` text,
  `status` varchar(50) DEFAULT 'pendente',
  `observacoes` text,

  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  KEY `usuario_id` (`usuario_id`),
  KEY `processo_id` (`processo_id`),
  KEY `arquivos_id` (`arquivos_id`),

  CONSTRAINT `atualizacoes_processo_ibfk_1`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE,

  CONSTRAINT `atualizacoes_processo_ibfk_2`
    FOREIGN KEY (`processo_id`)
    REFERENCES `processos` (`id`)
    ON DELETE CASCADE,

  CONSTRAINT `atualizacoes_processo_ibfk_3`
    FOREIGN KEY (`arquivos_id`)
    REFERENCES `arquivos` (`id`)
    ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========================================
-- REFRESH TOKENS
-- ========================================

CREATE TABLE `refresh_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(256) NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked` tinyint(1) DEFAULT '0',

  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  UNIQUE KEY `token` (`token`),

  KEY `idx_user_id` (`user_id`),
  KEY `idx_token` (`token`),
  KEY `idx_expires_at` (`expires_at`),

  CONSTRAINT `refresh_tokens_user_id_foreign`
    FOREIGN KEY (`user_id`)
    REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========================================
-- USUARIOS PROCESSO
-- ========================================

CREATE TABLE `usuarios_processo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `processo_id` int NOT NULL,

  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  UNIQUE KEY `usuarios_processo_usuario_id_processo_id`
    (`usuario_id`,`processo_id`),

  KEY `processo_id` (`processo_id`),

  CONSTRAINT `usuarios_processo_ibfk_1`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE,

  CONSTRAINT `usuarios_processo_ibfk_2`
    FOREIGN KEY (`processo_id`)
    REFERENCES `processos` (`id`)
    ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========================================
-- LOGS DE ACOES
-- ========================================

CREATE TABLE `logs_acoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `acao` varchar(100) NOT NULL,
  `recurso` varchar(50) NOT NULL,
  `recurso_id` int DEFAULT NULL,
  `detalhes` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `data_acao` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `logs_acoes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========================================
-- DADOS INICIAIS
-- ========================================

INSERT INTO `roles`
(`id`, `nome`, `createdAt`, `updatedAt`, `descricao`, `permissoes`, `ativo`)
VALUES
(1, 'Admin', NOW(), NOW(), NULL, NULL, 1),
(2, 'Professor', NOW(), NOW(), NULL, NULL, 1),
(3, 'Aluno', NOW(), NOW(), NULL, NULL, 1);

-- Inserir dados básicos de diligencia
INSERT IGNORE INTO `diligencia` (`id`, `nome`, `createdAt`, `updatedAt`) VALUES
(1, 'Audiência de Conciliação', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(2, 'Audiência de Instrução', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(3, 'Perícia Técnica', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(4, 'Citação', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(5, 'Intimação', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(6, 'Apresentar Defesa', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(7, 'Apresentar Recurso', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(8, 'Juntada de Documentos', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(9, 'Perícia', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(10, 'Audiência', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(11, 'Citação/Intimação', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(12, 'Defesa/Recurso', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(13, 'Documentos', '2025-08-04 12:42:32', '2025-08-04 12:42:32');

-- Inserir dados básicos de fase
INSERT IGNORE INTO `fase` (`id`, `nome`, `createdAt`, `updatedAt`) VALUES
(1, 'Petição Inicial', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(2, 'Citação', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(3, 'Contestação', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(4, 'Tréplica', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(5, 'Saneamento', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(6, 'Instrução', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(7, 'Alegações Finais', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(8, 'Sentença', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(9, 'Recurso', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(10, 'Execução', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(11, 'Inicial', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(12, 'Interlocutória', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(13, 'Final', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(14, 'Recursal', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(15, 'Execução', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(16, 'Arquivado', '2025-08-20 13:31:57', '2025-08-20 13:31:57'),
(17, 'Em Andamento', '2025-08-20 13:32:00', '2025-08-20 13:32:00'),
(18, 'Concluído', '2025-08-20 13:32:03', '2025-08-20 13:32:03'),
(19, 'Suspenso', '2025-08-20 13:32:06', '2025-08-20 13:32:06'),
(20, 'Cancelado', '2025-08-20 13:32:09', '2025-08-20 13:32:09'),
(21, 'Aguardando Documentos', '2025-08-20 13:32:14', '2025-08-20 13:32:14'),
(22, 'Em Análise', '2025-08-20 13:32:17', '2025-08-20 13:32:17'),
(23, 'Julgamento', '2025-08-20 13:32:20', '2025-08-20 13:32:20'),
(24, 'Execução de Sentença', '2025-08-20 13:32:23', '2025-08-20 13:32:23'),
(25, 'Cumprimento de Sentença', '2025-08-20 13:32:26', '2025-08-20 13:32:26'),
(26, 'Homologação', '2025-08-20 13:32:29', '2025-08-20 13:32:29'),
(27, 'Liquidação de Sentença', '2025-08-20 13:32:32', '2025-08-20 13:32:32'),
(28, 'Outros', '2025-08-20 13:32:35', '2025-08-20 13:32:35');


-- Inserir dados básicos de materia_assunto (OK)
INSERT IGNORE INTO `materia_assunto` (`id`, `nome`, `createdAt`, `updatedAt`) VALUES
(1, 'Direito Civil', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(2, 'Direito Penal', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(3, 'Direito do Trabalho', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(4, 'Direito Previdenciário', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(5, 'Direito de Família', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(6, 'Direito do Consumidor', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(7, 'Direito Administrativo', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(8, 'Direito Tributário', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(9, 'Direito Empresarial', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(10, 'Direito Ambiental', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(11, 'Direito Trabalhista', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(12, 'Direito Imobiliário', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(13, 'Direito Internacional', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(14, 'Direito Eleitoral', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(15, 'Direito Militar', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(16, 'Direito Marítimo', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(17, 'Direito Aeronáutico', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(18, 'Direito da Criança e do Adolescente', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(19, 'Direito da Saúde', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(20, 'Direito da Seguridade Social', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(21, 'Direito da Propriedade Intelectual', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(22, 'Direito da Tecnologia da Informação', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(23, 'Direito da Concorrência', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(24, 'Direito da Energia', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(25, 'Direito da Comunicação', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(26, 'Direito da Cultura', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(27, 'Direito da Mobilidade Urbana', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(28, 'Direito da Segurança Pública', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(29, 'Direito da Habitação', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(30, 'Direito da Inclusão Social', '2025-08-04 12:42:32', '2025-08-04 12:42:32');
-- Inserir dados básicos de local_tramitacao (OK)
INSERT IGNORE INTO `local_tramitacao` (`id`, `nome`, `createdAt`, `updatedAt`) VALUES
(1, '1ª Vara Cível de Cuiabá', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(2, '2ª Vara Cível de Cuiabá', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(3, 'Vara de Família de Cuiabá', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(4, 'Vara Criminal de Cuiabá', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(5, 'Juizado Especial Cível', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(6, 'Tribunal de Justiça - MT', '2025-08-02 20:17:10', '2025-08-02 20:17:10'),
(7, 'Vara Cível - Cuiabá', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(8, 'Vara Trabalhista - Várzea Grande', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(9, 'Vara da Infância - Cuiabá', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(10, 'Vara de Execuções Penais - Cuiabá', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(11, 'Vara de Registros Públicos - Cuiabá', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(12, 'Vara de Falências - Cuiabá', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(13, 'Vara de Direitos Difusos - Cuiabá', '2025-08-04 12:42:32', '2025-08-04 12:42:32'),
(14, 'Vara de Combate à Violência Doméstica - Cuiabá', '2025-08-04 12:42:32', '2025-08-04 12:42:32');

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- FINAL
-- ========================================
