'use strict';

/**
 * Fresh DB Baseline Schema Migration
 * Consolidated from 46 legacy migrations for greenfield databases.
 */
const STATEMENTS = [
  "CREATE SEQUENCE IF NOT EXISTS \"AccountClasses_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"AccountRemainings_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"Accounts_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"AuditEvents_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"Companies_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"CompanyClasses_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"CrossSlipDetails_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"CrossSlips_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"DocumentFiles_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"Documents_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"FiscalYears_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"ItemClasses_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"Items_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"Labels_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"MemberClasses_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"Members_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"Menus_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"MonthlyLogs_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"Projects_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"SimulationAssumptions_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"SimulationEntries_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"SimulationScenarios_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"Stickies_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"StickyStatuses_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"SubAccountRemainings_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"SubAccounts_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"TaskDetails_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"Tasks_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"TaxRules_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"Tenants_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"TransactionDetails_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"TransactionDocuments_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"TransactionKinds_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"Translations_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"Users_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"VoucherClasses_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"VoucherFiles_id_seq\";",
  "CREATE SEQUENCE IF NOT EXISTS \"Vouchers_id_seq\";",
  "CREATE TABLE \"AccountClasses\" (\n  \"id\" INTEGER DEFAULT nextval('\"AccountClasses_id_seq\"'::regclass) NOT NULL,\n  \"major\" VARCHAR(255),\n  \"middle\" VARCHAR(255),\n  \"minor\" VARCHAR(255),\n  \"field\" INTEGER,\n  \"adding\" INTEGER,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"AccountRemainings\" (\n  \"id\" INTEGER DEFAULT nextval('\"AccountRemainings_id_seq\"'::regclass) NOT NULL,\n  \"accountId\" INTEGER,\n  \"term\" INTEGER,\n  \"debit\" NUMERIC,\n  \"credit\" NUMERIC,\n  \"balance\" NUMERIC,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"Accounts\" (\n  \"id\" INTEGER DEFAULT nextval('\"Accounts_id_seq\"'::regclass) NOT NULL,\n  \"name\" VARCHAR(255),\n  \"key\" VARCHAR(255),\n  \"accountClassId\" INTEGER,\n  \"accountCode\" VARCHAR(255) NOT NULL,\n  \"taxClass\" INTEGER,\n  \"subAccountCount\" INTEGER,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"expiredAt\" TIMESTAMP WITH TIME ZONE,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"AuditEvents\" (\n  \"id\" INTEGER DEFAULT nextval('\"AuditEvents_id_seq\"'::regclass) NOT NULL,\n  \"tenantId\" INTEGER NOT NULL,\n  \"actorId\" INTEGER,\n  \"action\" VARCHAR(255) NOT NULL,\n  \"term\" INTEGER,\n  \"payload\" JSONB,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL\n);",
  "CREATE TABLE \"Companies\" (\n  \"id\" INTEGER DEFAULT nextval('\"Companies_id_seq\"'::regclass) NOT NULL,\n  \"companyClassId\" INTEGER,\n  \"name\" VARCHAR(255) NOT NULL,\n  \"chargeName\" VARCHAR(255),\n  \"ruby\" VARCHAR(255),\n  \"zip\" VARCHAR(255),\n  \"address1\" VARCHAR(255),\n  \"address2\" VARCHAR(255),\n  \"description\" TEXT,\n  \"key\" VARCHAR(255),\n  \"closingDate\" INTEGER,\n  \"paymentDate\" INTEGER,\n  \"telNo\" VARCHAR(255),\n  \"faxNo\" VARCHAR(255),\n  \"email\" VARCHAR(255),\n  \"url\" VARCHAR(255),\n  \"bankName\" VARCHAR(255),\n  \"bankBranchName\" VARCHAR(255),\n  \"accountType\" INTEGER,\n  \"accountNo\" VARCHAR(255),\n  \"invoiceNo\" TEXT,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"DUNS\" VARCHAR(255),\n  \"companyNo\" VARCHAR(255),\n  \"logoURL\" VARCHAR(255),\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"CompanyClasses\" (\n  \"id\" INTEGER DEFAULT nextval('\"CompanyClasses_id_seq\"'::regclass) NOT NULL,\n  \"name\" VARCHAR(255),\n  \"displayOrder\" INTEGER DEFAULT 0,\n  \"isClient\" BOOLEAN DEFAULT false,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"CrossSlipDetails\" (\n  \"id\" INTEGER DEFAULT nextval('\"CrossSlipDetails_id_seq\"'::regclass) NOT NULL,\n  \"crossSlipId\" INTEGER,\n  \"lineNo\" INTEGER,\n  \"debitAccount\" VARCHAR(255),\n  \"debitSubAccount\" INTEGER,\n  \"debitAmount\" NUMERIC,\n  \"debitTax\" NUMERIC,\n  \"debitVoucherId\" INTEGER,\n  \"creditAccount\" VARCHAR(255),\n  \"creditSubAccount\" INTEGER,\n  \"creditAmount\" NUMERIC,\n  \"creditTax\" NUMERIC,\n  \"creditVoucherId\" INTEGER,\n  \"application1\" VARCHAR(255),\n  \"application2\" VARCHAR(255),\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"debitTaxRuleId\" INTEGER,\n  \"creditTaxRuleId\" INTEGER,\n  \"projectId\" INTEGER,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"CrossSlips\" (\n  \"id\" INTEGER DEFAULT nextval('\"CrossSlips_id_seq\"'::regclass) NOT NULL,\n  \"term\" INTEGER,\n  \"year\" INTEGER NOT NULL,\n  \"month\" INTEGER NOT NULL,\n  \"day\" INTEGER NOT NULL,\n  \"no\" INTEGER NOT NULL,\n  \"lineCount\" INTEGER DEFAULT 0 NOT NULL,\n  \"key\" VARCHAR(255),\n  \"approvedBy\" INTEGER,\n  \"createdBy\" INTEGER,\n  \"updatedBy\" INTEGER,\n  \"approvedAt\" TIMESTAMP WITH TIME ZONE,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"DocumentFiles\" (\n  \"id\" INTEGER DEFAULT nextval('\"DocumentFiles_id_seq\"'::regclass) NOT NULL,\n  \"documentId\" INTEGER,\n  \"name\" VARCHAR(255),\n  \"mimeType\" VARCHAR(255),\n  \"body\" BYTEA,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"Documents\" (\n  \"id\" INTEGER DEFAULT nextval('\"Documents_id_seq\"'::regclass) NOT NULL,\n  \"issueDate\" DATE,\n  \"title\" VARCHAR(255),\n  \"descriptionType\" VARCHAR(255),\n  \"description\" TEXT,\n  \"handledBy\" INTEGER,\n  \"createdBy\" INTEGER,\n  \"updatedBy\" INTEGER,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"FiscalYears\" (\n  \"id\" INTEGER DEFAULT nextval('\"FiscalYears_id_seq\"'::regclass) NOT NULL,\n  \"startDate\" TIMESTAMP WITH TIME ZONE,\n  \"endDate\" TIMESTAMP WITH TIME ZONE,\n  \"term\" INTEGER,\n  \"year\" INTEGER,\n  \"taxIncluded\" BOOLEAN DEFAULT false,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"transactionCount\" INTEGER DEFAULT 0,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"ItemClasses\" (\n  \"id\" INTEGER DEFAULT nextval('\"ItemClasses_id_seq\"'::regclass) NOT NULL,\n  \"displayOrder\" INTEGER DEFAULT 0,\n  \"name\" VARCHAR(255),\n  \"product\" BOOLEAN,\n  \"inventoryManagement\" BOOLEAN,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"Items\" (\n  \"id\" INTEGER DEFAULT nextval('\"Items_id_seq\"'::regclass) NOT NULL,\n  \"itemClassId\" INTEGER,\n  \"key\" VARCHAR(255),\n  \"globalCode\" VARCHAR(255),\n  \"storageCode\" VARCHAR(255),\n  \"localCode\" VARCHAR(255),\n  \"name\" VARCHAR(255),\n  \"normalName\" VARCHAR(255),\n  \"spec\" VARCHAR(255),\n  \"standardPrice\" NUMERIC,\n  \"costPrice\" NUMERIC,\n  \"unit\" VARCHAR(255),\n  \"taxClass\" INTEGER,\n  \"documentId\" INTEGER,\n  \"handledBy\" INTEGER,\n  \"createdBy\" INTEGER,\n  \"updatedBy\" INTEGER,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"LabelAccounts\" (\n  \"labelId\" INTEGER NOT NULL,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"summaryType\" VARCHAR(255) DEFAULT 'credit'::character varying NOT NULL,\n  \"tenantId\" INTEGER NOT NULL,\n  \"accountId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"Labels\" (\n  \"id\" INTEGER DEFAULT nextval('\"Labels_id_seq\"'::regclass) NOT NULL,\n  \"name\" VARCHAR(255) NOT NULL,\n  \"description\" TEXT,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"MemberClasses\" (\n  \"id\" INTEGER DEFAULT nextval('\"MemberClasses_id_seq\"'::regclass) NOT NULL,\n  \"title\" VARCHAR(255),\n  \"displayOrder\" INTEGER DEFAULT 0,\n  \"executive\" BOOLEAN,\n  \"officer\" BOOLEAN,\n  \"fullTime\" BOOLEAN,\n  \"insurance\" BOOLEAN,\n  \"socialInsurance\" BOOLEAN,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL\n);",
  "CREATE TABLE \"Menus\" (\n  \"id\" INTEGER DEFAULT nextval('\"Menus_id_seq\"'::regclass) NOT NULL,\n  \"userId\" INTEGER,\n  \"title\" VARCHAR(255),\n  \"displayOrder\" INTEGER DEFAULT 0,\n  \"body\" TEXT,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"MonthlyLogs\" (\n  \"id\" INTEGER DEFAULT nextval('\"MonthlyLogs_id_seq\"'::regclass) NOT NULL,\n  \"term\" INTEGER NOT NULL,\n  \"month\" INTEGER NOT NULL,\n  \"slipCount\" INTEGER,\n  \"voucherCount\" INTEGER,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"ProjectLabels\" (\n  \"projectId\" INTEGER NOT NULL,\n  \"labelId\" INTEGER NOT NULL,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"displayOrder\" INTEGER DEFAULT 0 NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"Projects\" (\n  \"id\" INTEGER DEFAULT nextval('\"Projects_id_seq\"'::regclass) NOT NULL,\n  \"name\" VARCHAR(255) NOT NULL,\n  \"code\" VARCHAR(255),\n  \"startDate\" DATE,\n  \"endDate\" DATE,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"SimulationAssumptions\" (\n  \"id\" INTEGER DEFAULT nextval('\"SimulationAssumptions_id_seq\"'::regclass) NOT NULL,\n  \"tenantId\" INTEGER NOT NULL,\n  \"scenarioId\" INTEGER NOT NULL,\n  \"type\" VARCHAR(32) NOT NULL,\n  \"name\" VARCHAR(200) NOT NULL,\n  \"parameters\" JSONB NOT NULL,\n  \"startMonth\" DATE NOT NULL,\n  \"endMonth\" DATE,\n  \"status\" VARCHAR(16) DEFAULT 'active'::character varying NOT NULL,\n  \"generatedCount\" INTEGER DEFAULT 0 NOT NULL,\n  \"generatedHash\" VARCHAR(64),\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL\n);",
  "CREATE TABLE \"SimulationEntries\" (\n  \"id\" INTEGER DEFAULT nextval('\"SimulationEntries_id_seq\"'::regclass) NOT NULL,\n  \"tenantId\" INTEGER NOT NULL,\n  \"scenarioId\" INTEGER NOT NULL,\n  \"date\" DATE NOT NULL,\n  \"debitAccount\" VARCHAR(20) NOT NULL,\n  \"debitSubAccount\" INTEGER,\n  \"debitAmount\" NUMERIC NOT NULL,\n  \"creditAccount\" VARCHAR(20) NOT NULL,\n  \"creditSubAccount\" INTEGER,\n  \"creditAmount\" NUMERIC NOT NULL,\n  \"taxRuleId\" INTEGER,\n  \"projectId\" INTEGER,\n  \"labelId\" INTEGER,\n  \"memo\" VARCHAR(500),\n  \"sourceType\" VARCHAR(16) DEFAULT 'manual'::character varying NOT NULL,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL\n);",
  "CREATE TABLE \"SimulationScenarios\" (\n  \"id\" INTEGER DEFAULT nextval('\"SimulationScenarios_id_seq\"'::regclass) NOT NULL,\n  \"tenantId\" INTEGER NOT NULL,\n  \"name\" VARCHAR(200) NOT NULL,\n  \"description\" TEXT,\n  \"baseTerm\" INTEGER NOT NULL,\n  \"basePeriodFrom\" DATE NOT NULL,\n  \"basePeriodTo\" DATE NOT NULL,\n  \"simPeriodFrom\" DATE NOT NULL,\n  \"simPeriodTo\" DATE NOT NULL,\n  \"status\" VARCHAR(16) DEFAULT 'draft'::character varying NOT NULL,\n  \"ownerId\" INTEGER NOT NULL,\n  \"visibility\" VARCHAR(16) DEFAULT 'private'::character varying NOT NULL,\n  \"lockedAt\" DATE,\n  \"lockedBy\" INTEGER,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL\n);",
  "CREATE TABLE \"Stickies\" (\n  \"id\" INTEGER DEFAULT nextval('\"Stickies_id_seq\"'::regclass) NOT NULL,\n  \"tenantId\" INTEGER NOT NULL,\n  \"authorId\" INTEGER,\n  \"message\" TEXT,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL\n);",
  "CREATE TABLE \"StickyStatuses\" (\n  \"id\" INTEGER DEFAULT nextval('\"StickyStatuses_id_seq\"'::regclass) NOT NULL,\n  \"tenantId\" INTEGER NOT NULL,\n  \"stickyId\" INTEGER,\n  \"receiverId\" INTEGER,\n  \"showHide\" BOOLEAN,\n  \"importance\" INTEGER,\n  \"posX\" INTEGER,\n  \"posY\" INTEGER,\n  \"completedAt\" TIMESTAMP WITH TIME ZONE,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL\n);",
  "CREATE TABLE \"SubAccountRemainings\" (\n  \"id\" INTEGER DEFAULT nextval('\"SubAccountRemainings_id_seq\"'::regclass) NOT NULL,\n  \"subAccountId\" INTEGER,\n  \"term\" INTEGER,\n  \"debit\" NUMERIC,\n  \"credit\" NUMERIC,\n  \"balance\" NUMERIC,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"SubAccounts\" (\n  \"id\" INTEGER DEFAULT nextval('\"SubAccounts_id_seq\"'::regclass) NOT NULL,\n  \"name\" VARCHAR(255),\n  \"key\" VARCHAR(255),\n  \"accountId\" INTEGER,\n  \"subAccountCode\" INTEGER,\n  \"taxClass\" INTEGER,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"TaskDetails\" (\n  \"id\" INTEGER DEFAULT nextval('\"TaskDetails_id_seq\"'::regclass) NOT NULL,\n  \"taskId\" INTEGER,\n  \"lineNo\" INTEGER,\n  \"itemId\" INTEGER,\n  \"itemName\" TEXT,\n  \"itemSpec\" TEXT,\n  \"unitPrice\" NUMERIC,\n  \"itemNumber\" NUMERIC,\n  \"unit\" VARCHAR(255),\n  \"amount\" NUMERIC,\n  \"description\" TEXT,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"taxRuleId\" INTEGER,\n  \"tax\" NUMERIC,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"Tasks\" (\n  \"id\" INTEGER DEFAULT nextval('\"Tasks_id_seq\"'::regclass) NOT NULL,\n  \"companyId\" INTEGER,\n  \"issueDate\" DATE,\n  \"deliveryLimit\" DATE,\n  \"companyName\" VARCHAR(255),\n  \"chargeName\" VARCHAR(255),\n  \"zip\" VARCHAR(255),\n  \"address1\" VARCHAR(255),\n  \"address2\" VARCHAR(255),\n  \"subject\" VARCHAR(255),\n  \"paymentMethod\" VARCHAR(255),\n  \"amount\" NUMERIC,\n  \"tax\" NUMERIC,\n  \"documentId\" INTEGER,\n  \"handledBy\" INTEGER,\n  \"createdBy\" INTEGER,\n  \"updatedBy\" INTEGER,\n  \"endedAt\" DATE,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"TaxRules\" (\n  \"id\" INTEGER DEFAULT nextval('\"TaxRules_id_seq\"'::regclass) NOT NULL,\n  \"label\" VARCHAR(255) NOT NULL,\n  \"displayOrder\" INTEGER DEFAULT 0,\n  \"taxClass\" INTEGER DEFAULT 2,\n  \"rate\" INTEGER DEFAULT 0,\n  \"startDate\" DATE,\n  \"endDate\" DATE,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"TenantMembers\" (\n  \"id\" INTEGER DEFAULT nextval('\"Members_id_seq\"'::regclass) NOT NULL,\n  \"userId\" INTEGER,\n  \"memberClassId\" INTEGER,\n  \"operation\" TEXT,\n  \"legalName\" VARCHAR(255),\n  \"legalRuby\" VARCHAR(255),\n  \"legalSex\" INTEGER,\n  \"tradingName\" VARCHAR(255),\n  \"zip\" VARCHAR(255),\n  \"address1\" VARCHAR(255),\n  \"address2\" VARCHAR(255),\n  \"email\" VARCHAR(255),\n  \"telNo\" VARCHAR(255),\n  \"bankName\" VARCHAR(255),\n  \"bankBranchName\" VARCHAR(255),\n  \"accountType\" VARCHAR(255),\n  \"accountNo\" VARCHAR(255),\n  \"birthDate\" DATE,\n  \"dependent\" INTEGER,\n  \"socialInsuranceNumber\" VARCHAR(255),\n  \"joiningDate\" DATE,\n  \"resignedDate\" DATE,\n  \"resignReason\" INTEGER,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL,\n  \"isOwner\" BOOLEAN DEFAULT false NOT NULL,\n  \"isDefault\" BOOLEAN DEFAULT false NOT NULL,\n  \"status\" VARCHAR(255) DEFAULT 'active'::character varying NOT NULL,\n  \"accounting\" BOOLEAN DEFAULT false NOT NULL,\n  \"fiscalBrowsing\" BOOLEAN DEFAULT false NOT NULL,\n  \"approvable\" BOOLEAN DEFAULT false NOT NULL,\n  \"administrable\" BOOLEAN DEFAULT false NOT NULL,\n  \"companyManagement\" BOOLEAN DEFAULT false NOT NULL,\n  \"inventoryManagement\" BOOLEAN DEFAULT false NOT NULL,\n  \"personnelManagement\" BOOLEAN DEFAULT false NOT NULL,\n  \"tenantSettings\" BOOLEAN DEFAULT false NOT NULL\n);",
  "CREATE TABLE \"Tenants\" (\n  \"id\" INTEGER DEFAULT nextval('\"Tenants_id_seq\"'::regclass) NOT NULL,\n  \"slug\" VARCHAR(255) NOT NULL,\n  \"name\" VARCHAR(255) NOT NULL,\n  \"status\" VARCHAR(255) DEFAULT 'active'::character varying NOT NULL,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"settings\" JSONB\n);",
  "CREATE TABLE \"TransactionDetails\" (\n  \"id\" INTEGER DEFAULT nextval('\"TransactionDetails_id_seq\"'::regclass) NOT NULL,\n  \"transactionDocumentId\" INTEGER,\n  \"lineNo\" INTEGER,\n  \"itemId\" INTEGER,\n  \"itemName\" TEXT,\n  \"itemSpec\" TEXT,\n  \"unitPrice\" NUMERIC,\n  \"itemNumber\" NUMERIC,\n  \"unit\" VARCHAR(255),\n  \"amount\" NUMERIC,\n  \"description\" TEXT,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"taxRuleId\" INTEGER,\n  \"tax\" NUMERIC,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"TransactionDocuments\" (\n  \"id\" INTEGER DEFAULT nextval('\"TransactionDocuments_id_seq\"'::regclass) NOT NULL,\n  \"no\" VARCHAR(255),\n  \"kindId\" INTEGER NOT NULL,\n  \"issueDate\" DATE,\n  \"deliveryLimit\" DATE,\n  \"companyId\" INTEGER,\n  \"taskId\" INTEGER,\n  \"companyName\" VARCHAR(255),\n  \"chargeName\" VARCHAR(255),\n  \"zip\" VARCHAR(255),\n  \"address1\" VARCHAR(255),\n  \"address2\" VARCHAR(255),\n  \"subject\" VARCHAR(255),\n  \"paymentMethod\" VARCHAR(255),\n  \"amount\" NUMERIC,\n  \"tax\" NUMERIC,\n  \"description\" TEXT,\n  \"documentId\" INTEGER,\n  \"voucherId\" INTEGER,\n  \"handledBy\" INTEGER,\n  \"createdBy\" INTEGER,\n  \"updatedBy\" INTEGER,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"TransactionKinds\" (\n  \"id\" INTEGER DEFAULT nextval('\"TransactionKinds_id_seq\"'::regclass) NOT NULL,\n  \"label\" VARCHAR(255) NOT NULL,\n  \"displayOrder\" INTEGER DEFAULT 0,\n  \"hasDetails\" BOOLEAN DEFAULT false,\n  \"hasDocument\" INTEGER DEFAULT 0,\n  \"forCompany\" BOOLEAN DEFAULT true,\n  \"forBook\" BOOLEAN DEFAULT false,\n  \"bookId\" INTEGER,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"Translations\" (\n  \"id\" INTEGER DEFAULT nextval('\"Translations_id_seq\"'::regclass) NOT NULL,\n  \"tableName\" VARCHAR(255) NOT NULL,\n  \"recordKey\" VARCHAR(255) NOT NULL,\n  \"field\" VARCHAR(255) NOT NULL,\n  \"language\" VARCHAR(5) NOT NULL,\n  \"value\" TEXT NOT NULL,\n  \"tenantId\" INTEGER,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL\n);",
  "CREATE TABLE \"Users\" (\n  \"id\" INTEGER DEFAULT nextval('\"Users_id_seq\"'::regclass) NOT NULL,\n  \"name\" VARCHAR(255) NOT NULL,\n  \"hashPassword\" VARCHAR(255) NOT NULL,\n  \"deauthorizedAt\" TIMESTAMP WITH TIME ZONE,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"mail\" VARCHAR(255),\n  \"legalName\" VARCHAR(255) NOT NULL,\n  \"legalRuby\" VARCHAR(255),\n  \"legalSex\" INTEGER,\n  \"birthDate\" DATE,\n  \"email\" VARCHAR(255),\n  \"zip\" VARCHAR(255),\n  \"telNo\" VARCHAR(255),\n  \"address1\" VARCHAR(255),\n  \"address2\" VARCHAR(255),\n  \"languagePair\" JSONB\n);",
  "CREATE TABLE \"VoucherClasses\" (\n  \"id\" INTEGER DEFAULT nextval('\"VoucherClasses_id_seq\"'::regclass) NOT NULL,\n  \"name\" VARCHAR(255),\n  \"displayOrder\" INTEGER DEFAULT 0,\n  \"send\" BOOLEAN DEFAULT false,\n  \"form\" VARCHAR(255),\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"VoucherFiles\" (\n  \"id\" INTEGER DEFAULT nextval('\"VoucherFiles_id_seq\"'::regclass) NOT NULL,\n  \"voucherId\" INTEGER,\n  \"name\" VARCHAR(255),\n  \"mimeType\" VARCHAR(255),\n  \"body\" BYTEA,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"Vouchers\" (\n  \"id\" INTEGER DEFAULT nextval('\"Vouchers_id_seq\"'::regclass) NOT NULL,\n  \"voucherClassId\" INTEGER,\n  \"issueDate\" DATE NOT NULL,\n  \"paymentDate\" DATE,\n  \"companyId\" INTEGER,\n  \"amount\" NUMERIC,\n  \"tax\" NUMERIC,\n  \"description\" TEXT,\n  \"invoiceNo\" TEXT,\n  \"createdBy\" INTEGER,\n  \"updatedBy\" INTEGER,\n  \"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL,\n  \"taxRuleId\" INTEGER,\n  \"tenantId\" INTEGER NOT NULL\n);",
  "CREATE TABLE \"session\" (\n  \"sid\" VARCHAR(255) NOT NULL,\n  \"sess\" JSON NOT NULL,\n  \"expire\" TIMESTAMP WITHOUT TIME ZONE NOT NULL\n);",
  "ALTER SEQUENCE \"AccountClasses_id_seq\" OWNED BY \"AccountClasses\".\"id\";",
  "ALTER SEQUENCE \"AccountRemainings_id_seq\" OWNED BY \"AccountRemainings\".\"id\";",
  "ALTER SEQUENCE \"Accounts_id_seq\" OWNED BY \"Accounts\".\"id\";",
  "ALTER SEQUENCE \"AuditEvents_id_seq\" OWNED BY \"AuditEvents\".\"id\";",
  "ALTER SEQUENCE \"Companies_id_seq\" OWNED BY \"Companies\".\"id\";",
  "ALTER SEQUENCE \"CompanyClasses_id_seq\" OWNED BY \"CompanyClasses\".\"id\";",
  "ALTER SEQUENCE \"CrossSlipDetails_id_seq\" OWNED BY \"CrossSlipDetails\".\"id\";",
  "ALTER SEQUENCE \"CrossSlips_id_seq\" OWNED BY \"CrossSlips\".\"id\";",
  "ALTER SEQUENCE \"DocumentFiles_id_seq\" OWNED BY \"DocumentFiles\".\"id\";",
  "ALTER SEQUENCE \"Documents_id_seq\" OWNED BY \"Documents\".\"id\";",
  "ALTER SEQUENCE \"FiscalYears_id_seq\" OWNED BY \"FiscalYears\".\"id\";",
  "ALTER SEQUENCE \"ItemClasses_id_seq\" OWNED BY \"ItemClasses\".\"id\";",
  "ALTER SEQUENCE \"Items_id_seq\" OWNED BY \"Items\".\"id\";",
  "ALTER SEQUENCE \"Labels_id_seq\" OWNED BY \"Labels\".\"id\";",
  "ALTER SEQUENCE \"MemberClasses_id_seq\" OWNED BY \"MemberClasses\".\"id\";",
  "ALTER SEQUENCE \"Members_id_seq\" OWNED BY \"TenantMembers\".\"id\";",
  "ALTER SEQUENCE \"Menus_id_seq\" OWNED BY \"Menus\".\"id\";",
  "ALTER SEQUENCE \"MonthlyLogs_id_seq\" OWNED BY \"MonthlyLogs\".\"id\";",
  "ALTER SEQUENCE \"Projects_id_seq\" OWNED BY \"Projects\".\"id\";",
  "ALTER SEQUENCE \"SimulationAssumptions_id_seq\" OWNED BY \"SimulationAssumptions\".\"id\";",
  "ALTER SEQUENCE \"SimulationEntries_id_seq\" OWNED BY \"SimulationEntries\".\"id\";",
  "ALTER SEQUENCE \"SimulationScenarios_id_seq\" OWNED BY \"SimulationScenarios\".\"id\";",
  "ALTER SEQUENCE \"Stickies_id_seq\" OWNED BY \"Stickies\".\"id\";",
  "ALTER SEQUENCE \"StickyStatuses_id_seq\" OWNED BY \"StickyStatuses\".\"id\";",
  "ALTER SEQUENCE \"SubAccountRemainings_id_seq\" OWNED BY \"SubAccountRemainings\".\"id\";",
  "ALTER SEQUENCE \"SubAccounts_id_seq\" OWNED BY \"SubAccounts\".\"id\";",
  "ALTER SEQUENCE \"TaskDetails_id_seq\" OWNED BY \"TaskDetails\".\"id\";",
  "ALTER SEQUENCE \"Tasks_id_seq\" OWNED BY \"Tasks\".\"id\";",
  "ALTER SEQUENCE \"TaxRules_id_seq\" OWNED BY \"TaxRules\".\"id\";",
  "ALTER SEQUENCE \"Tenants_id_seq\" OWNED BY \"Tenants\".\"id\";",
  "ALTER SEQUENCE \"TransactionDetails_id_seq\" OWNED BY \"TransactionDetails\".\"id\";",
  "ALTER SEQUENCE \"TransactionDocuments_id_seq\" OWNED BY \"TransactionDocuments\".\"id\";",
  "ALTER SEQUENCE \"TransactionKinds_id_seq\" OWNED BY \"TransactionKinds\".\"id\";",
  "ALTER SEQUENCE \"Translations_id_seq\" OWNED BY \"Translations\".\"id\";",
  "ALTER SEQUENCE \"Users_id_seq\" OWNED BY \"Users\".\"id\";",
  "ALTER SEQUENCE \"VoucherClasses_id_seq\" OWNED BY \"VoucherClasses\".\"id\";",
  "ALTER SEQUENCE \"VoucherFiles_id_seq\" OWNED BY \"VoucherFiles\".\"id\";",
  "ALTER SEQUENCE \"Vouchers_id_seq\" OWNED BY \"Vouchers\".\"id\";",
  "ALTER TABLE \"AccountClasses\" ADD CONSTRAINT \"AccountClasses_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"AccountRemainings\" ADD CONSTRAINT \"AccountRemainings_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"AccountRemainings\" ADD CONSTRAINT \"AccountRemainings_tenantId_term_accountId_key\" UNIQUE (\"tenantId\", term, \"accountId\");",
  "ALTER TABLE \"Accounts\" ADD CONSTRAINT \"Accounts_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"Accounts\" ADD CONSTRAINT \"Accounts_tenantId_accountCode_key\" UNIQUE (\"tenantId\", \"accountCode\");",
  "ALTER TABLE \"AuditEvents\" ADD CONSTRAINT \"AuditEvents_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"Companies\" ADD CONSTRAINT \"Companies_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"CompanyClasses\" ADD CONSTRAINT \"CompanyClasses_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"CrossSlipDetails\" ADD CONSTRAINT \"CrossSlipDetails_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"CrossSlips\" ADD CONSTRAINT \"CrossSlips_id_tenantId_key\" UNIQUE (id, \"tenantId\");",
  "ALTER TABLE \"CrossSlips\" ADD CONSTRAINT \"CrossSlips_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"CrossSlips\" ADD CONSTRAINT \"CrossSlips_tenantId_year_month_no_key\" UNIQUE (\"tenantId\", year, month, no);",
  "ALTER TABLE \"DocumentFiles\" ADD CONSTRAINT \"DocumentFiles_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"Documents\" ADD CONSTRAINT \"Documents_id_tenantId_key\" UNIQUE (id, \"tenantId\");",
  "ALTER TABLE \"Documents\" ADD CONSTRAINT \"Documents_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"FiscalYears\" ADD CONSTRAINT \"FiscalYears_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"ItemClasses\" ADD CONSTRAINT \"ItemClasses_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"Items\" ADD CONSTRAINT \"Items_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"LabelAccounts\" ADD CONSTRAINT \"LabelAccounts_labelId_accountId_tenantId_unique\" UNIQUE (\"labelId\", \"accountId\", \"tenantId\");",
  "ALTER TABLE \"Labels\" ADD CONSTRAINT \"Labels_id_tenantId_key\" UNIQUE (id, \"tenantId\");",
  "ALTER TABLE \"Labels\" ADD CONSTRAINT \"Labels_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"Labels\" ADD CONSTRAINT \"Labels_tenantId_name_key\" UNIQUE (\"tenantId\", name);",
  "ALTER TABLE \"MemberClasses\" ADD CONSTRAINT \"MemberClasses_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"Menus\" ADD CONSTRAINT \"Menus_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"MonthlyLogs\" ADD CONSTRAINT \"MonthlyLogs_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"MonthlyLogs\" ADD CONSTRAINT \"MonthlyLogs_tenantId_term_month_key\" UNIQUE (\"tenantId\", term, month);",
  "ALTER TABLE \"ProjectLabels\" ADD CONSTRAINT \"ProjectLabels_pkey\" PRIMARY KEY (\"projectId\", \"labelId\");",
  "ALTER TABLE \"Projects\" ADD CONSTRAINT \"Projects_id_tenantId_key\" UNIQUE (id, \"tenantId\");",
  "ALTER TABLE \"Projects\" ADD CONSTRAINT \"Projects_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"Projects\" ADD CONSTRAINT \"Projects_tenantId_code_key\" UNIQUE (\"tenantId\", code);",
  "ALTER TABLE \"SimulationAssumptions\" ADD CONSTRAINT \"SimulationAssumptions_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"SimulationEntries\" ADD CONSTRAINT \"SimulationEntries_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"SimulationScenarios\" ADD CONSTRAINT \"SimulationScenarios_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"Stickies\" ADD CONSTRAINT \"Stickies_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"StickyStatuses\" ADD CONSTRAINT \"StickyStatuses_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"SubAccountRemainings\" ADD CONSTRAINT \"SubAccountRemainings_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"SubAccounts\" ADD CONSTRAINT \"SubAccounts_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"TaskDetails\" ADD CONSTRAINT \"TaskDetails_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"Tasks\" ADD CONSTRAINT \"Tasks_id_tenantId_key\" UNIQUE (id, \"tenantId\");",
  "ALTER TABLE \"Tasks\" ADD CONSTRAINT \"Tasks_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"TaxRules\" ADD CONSTRAINT \"TaxRules_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"TenantMembers\" ADD CONSTRAINT \"Members_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"Tenants\" ADD CONSTRAINT \"Tenants_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"Tenants\" ADD CONSTRAINT \"Tenants_slug_key\" UNIQUE (slug);",
  "ALTER TABLE \"TransactionDetails\" ADD CONSTRAINT \"TransactionDetails_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"TransactionDocuments\" ADD CONSTRAINT \"TransactionDocuments_id_tenantId_key\" UNIQUE (id, \"tenantId\");",
  "ALTER TABLE \"TransactionDocuments\" ADD CONSTRAINT \"TransactionDocuments_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"TransactionKinds\" ADD CONSTRAINT \"TransactionKinds_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"Translations\" ADD CONSTRAINT \"Translations_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"Users\" ADD CONSTRAINT \"Users_name_key\" UNIQUE (name);",
  "ALTER TABLE \"Users\" ADD CONSTRAINT \"Users_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"VoucherClasses\" ADD CONSTRAINT \"VoucherClasses_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"VoucherFiles\" ADD CONSTRAINT \"VoucherFiles_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"Vouchers\" ADD CONSTRAINT \"Vouchers_id_tenantId_key\" UNIQUE (id, \"tenantId\");",
  "ALTER TABLE \"Vouchers\" ADD CONSTRAINT \"Vouchers_pkey\" PRIMARY KEY (id);",
  "ALTER TABLE \"session\" ADD CONSTRAINT \"session_pkey\" PRIMARY KEY (sid);",
  "ALTER TABLE \"TenantMembers\" ADD CONSTRAINT \"tenantmembers_status_chk\" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])));",
  "ALTER TABLE \"Tenants\" ADD CONSTRAINT \"tenants_status_chk\" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])));",
  "ALTER TABLE \"AccountClasses\" ADD CONSTRAINT \"AccountClasses_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"AccountRemainings\" ADD CONSTRAINT \"AccountRemainings_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Accounts\" ADD CONSTRAINT \"Accounts_accountClassId_fkey\" FOREIGN KEY (\"accountClassId\") REFERENCES \"AccountClasses\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"Accounts\" ADD CONSTRAINT \"Accounts_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Companies\" ADD CONSTRAINT \"Companies_companyClassId_fkey\" FOREIGN KEY (\"companyClassId\") REFERENCES \"CompanyClasses\"(id) ON UPDATE CASCADE ON DELETE SET NULL;",
  "ALTER TABLE \"Companies\" ADD CONSTRAINT \"Companies_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"CompanyClasses\" ADD CONSTRAINT \"CompanyClasses_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"CrossSlipDetails\" ADD CONSTRAINT \"CrossSlipDetails_creditTaxRuleId_fkey\" FOREIGN KEY (\"creditTaxRuleId\") REFERENCES \"TaxRules\"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;",
  "ALTER TABLE \"CrossSlipDetails\" ADD CONSTRAINT \"CrossSlipDetails_creditVoucherId_fkey\" FOREIGN KEY (\"creditVoucherId\") REFERENCES \"Vouchers\"(id) ON UPDATE CASCADE ON DELETE SET NULL;",
  "ALTER TABLE \"CrossSlipDetails\" ADD CONSTRAINT \"CrossSlipDetails_crossSlipId_fkey\" FOREIGN KEY (\"crossSlipId\") REFERENCES \"CrossSlips\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"CrossSlipDetails\" ADD CONSTRAINT \"CrossSlipDetails_crossSlipId_tenantId_fkey\" FOREIGN KEY (\"crossSlipId\", \"tenantId\") REFERENCES \"CrossSlips\"(id, \"tenantId\") ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"CrossSlipDetails\" ADD CONSTRAINT \"CrossSlipDetails_debitTaxRuleId_fkey\" FOREIGN KEY (\"debitTaxRuleId\") REFERENCES \"TaxRules\"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;",
  "ALTER TABLE \"CrossSlipDetails\" ADD CONSTRAINT \"CrossSlipDetails_debitVoucherId_fkey\" FOREIGN KEY (\"debitVoucherId\") REFERENCES \"Vouchers\"(id) ON UPDATE CASCADE ON DELETE SET NULL;",
  "ALTER TABLE \"CrossSlipDetails\" ADD CONSTRAINT \"CrossSlipDetails_projectId_fkey\" FOREIGN KEY (\"projectId\") REFERENCES \"Projects\"(id) ON UPDATE CASCADE ON DELETE SET NULL;",
  "ALTER TABLE \"CrossSlipDetails\" ADD CONSTRAINT \"CrossSlipDetails_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"CrossSlips\" ADD CONSTRAINT \"CrossSlips_approvedBy_fkey\" FOREIGN KEY (\"approvedBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"CrossSlips\" ADD CONSTRAINT \"CrossSlips_createdBy_fkey\" FOREIGN KEY (\"createdBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"CrossSlips\" ADD CONSTRAINT \"CrossSlips_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"CrossSlips\" ADD CONSTRAINT \"CrossSlips_updatedBy_fkey\" FOREIGN KEY (\"updatedBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"DocumentFiles\" ADD CONSTRAINT \"DocumentFiles_documentId_fkey\" FOREIGN KEY (\"documentId\") REFERENCES \"Documents\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"DocumentFiles\" ADD CONSTRAINT \"DocumentFiles_documentId_tenantId_fkey\" FOREIGN KEY (\"documentId\", \"tenantId\") REFERENCES \"Documents\"(id, \"tenantId\") ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"DocumentFiles\" ADD CONSTRAINT \"DocumentFiles_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Documents\" ADD CONSTRAINT \"Documents_createdBy_fkey\" FOREIGN KEY (\"createdBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Documents\" ADD CONSTRAINT \"Documents_handledBy_fkey\" FOREIGN KEY (\"handledBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Documents\" ADD CONSTRAINT \"Documents_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Documents\" ADD CONSTRAINT \"Documents_updatedBy_fkey\" FOREIGN KEY (\"updatedBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"FiscalYears\" ADD CONSTRAINT \"FiscalYears_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"ItemClasses\" ADD CONSTRAINT \"ItemClasses_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Items\" ADD CONSTRAINT \"Items_createdBy_fkey\" FOREIGN KEY (\"createdBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Items\" ADD CONSTRAINT \"Items_documentId_fkey\" FOREIGN KEY (\"documentId\") REFERENCES \"Documents\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"Items\" ADD CONSTRAINT \"Items_handledBy_fkey\" FOREIGN KEY (\"handledBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Items\" ADD CONSTRAINT \"Items_itemClassId_fkey\" FOREIGN KEY (\"itemClassId\") REFERENCES \"ItemClasses\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"Items\" ADD CONSTRAINT \"Items_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Items\" ADD CONSTRAINT \"Items_updatedBy_fkey\" FOREIGN KEY (\"updatedBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"LabelAccounts\" ADD CONSTRAINT \"LabelAccounts_accountId_fkey\" FOREIGN KEY (\"accountId\") REFERENCES \"Accounts\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"LabelAccounts\" ADD CONSTRAINT \"LabelAccounts_accountId_fkey1\" FOREIGN KEY (\"accountId\") REFERENCES \"Accounts\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"LabelAccounts\" ADD CONSTRAINT \"LabelAccounts_labelId_fkey\" FOREIGN KEY (\"labelId\") REFERENCES \"Labels\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"LabelAccounts\" ADD CONSTRAINT \"LabelAccounts_labelId_tenantId_fkey\" FOREIGN KEY (\"labelId\", \"tenantId\") REFERENCES \"Labels\"(id, \"tenantId\") ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"LabelAccounts\" ADD CONSTRAINT \"LabelAccounts_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Labels\" ADD CONSTRAINT \"Labels_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Menus\" ADD CONSTRAINT \"Menus_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Menus\" ADD CONSTRAINT \"Menus_userId_fkey\" FOREIGN KEY (\"userId\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"MonthlyLogs\" ADD CONSTRAINT \"MonthlyLogs_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"ProjectLabels\" ADD CONSTRAINT \"ProjectLabels_labelId_fkey\" FOREIGN KEY (\"labelId\") REFERENCES \"Labels\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"ProjectLabels\" ADD CONSTRAINT \"ProjectLabels_projectId_fkey\" FOREIGN KEY (\"projectId\") REFERENCES \"Projects\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"ProjectLabels\" ADD CONSTRAINT \"ProjectLabels_projectId_tenantId_fkey\" FOREIGN KEY (\"projectId\", \"tenantId\") REFERENCES \"Projects\"(id, \"tenantId\") ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"ProjectLabels\" ADD CONSTRAINT \"ProjectLabels_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Projects\" ADD CONSTRAINT \"Projects_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"SimulationAssumptions\" ADD CONSTRAINT \"SimulationAssumptions_scenarioId_fkey\" FOREIGN KEY (\"scenarioId\") REFERENCES \"SimulationScenarios\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"SimulationAssumptions\" ADD CONSTRAINT \"SimulationAssumptions_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"SimulationEntries\" ADD CONSTRAINT \"SimulationEntries_scenarioId_fkey\" FOREIGN KEY (\"scenarioId\") REFERENCES \"SimulationScenarios\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"SimulationScenarios\" ADD CONSTRAINT \"SimulationScenarios_lockedBy_fkey\" FOREIGN KEY (\"lockedBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE SET NULL;",
  "ALTER TABLE \"SimulationScenarios\" ADD CONSTRAINT \"SimulationScenarios_ownerId_fkey\" FOREIGN KEY (\"ownerId\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"SimulationScenarios\" ADD CONSTRAINT \"SimulationScenarios_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Stickies\" ADD CONSTRAINT \"Stickies_authorId_fkey\" FOREIGN KEY (\"authorId\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE SET NULL;",
  "ALTER TABLE \"Stickies\" ADD CONSTRAINT \"Stickies_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"StickyStatuses\" ADD CONSTRAINT \"StickyStatuses_receiverId_fkey\" FOREIGN KEY (\"receiverId\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"StickyStatuses\" ADD CONSTRAINT \"StickyStatuses_stickyId_fkey\" FOREIGN KEY (\"stickyId\") REFERENCES \"Stickies\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"StickyStatuses\" ADD CONSTRAINT \"StickyStatuses_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"SubAccountRemainings\" ADD CONSTRAINT \"SubAccountRemainings_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"SubAccounts\" ADD CONSTRAINT \"SubAccounts_accountId_fkey\" FOREIGN KEY (\"accountId\") REFERENCES \"Accounts\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"SubAccounts\" ADD CONSTRAINT \"SubAccounts_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"TaskDetails\" ADD CONSTRAINT \"TaskDetails_taskId_fkey\" FOREIGN KEY (\"taskId\") REFERENCES \"Tasks\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"TaskDetails\" ADD CONSTRAINT \"TaskDetails_taskId_tenantId_fkey\" FOREIGN KEY (\"taskId\", \"tenantId\") REFERENCES \"Tasks\"(id, \"tenantId\") ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"TaskDetails\" ADD CONSTRAINT \"TaskDetails_taxRuleId_fkey\" FOREIGN KEY (\"taxRuleId\") REFERENCES \"TaxRules\"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;",
  "ALTER TABLE \"TaskDetails\" ADD CONSTRAINT \"TaskDetails_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Tasks\" ADD CONSTRAINT \"Tasks_companyId_fkey\" FOREIGN KEY (\"companyId\") REFERENCES \"Companies\"(id) ON UPDATE CASCADE ON DELETE SET NULL;",
  "ALTER TABLE \"Tasks\" ADD CONSTRAINT \"Tasks_createdBy_fkey\" FOREIGN KEY (\"createdBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Tasks\" ADD CONSTRAINT \"Tasks_documentId_fkey\" FOREIGN KEY (\"documentId\") REFERENCES \"Documents\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"Tasks\" ADD CONSTRAINT \"Tasks_handledBy_fkey\" FOREIGN KEY (\"handledBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Tasks\" ADD CONSTRAINT \"Tasks_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Tasks\" ADD CONSTRAINT \"Tasks_updatedBy_fkey\" FOREIGN KEY (\"updatedBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"TaxRules\" ADD CONSTRAINT \"TaxRules_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"TenantMembers\" ADD CONSTRAINT \"Members_memberClassId_fkey\" FOREIGN KEY (\"memberClassId\") REFERENCES \"MemberClasses\"(id);",
  "ALTER TABLE \"TenantMembers\" ADD CONSTRAINT \"Members_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"TransactionDetails\" ADD CONSTRAINT \"TransactionDetails_taxRuleId_fkey\" FOREIGN KEY (\"taxRuleId\") REFERENCES \"TaxRules\"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;",
  "ALTER TABLE \"TransactionDetails\" ADD CONSTRAINT \"TransactionDetails_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"TransactionDetails\" ADD CONSTRAINT \"TransactionDetails_transactionDocumentId_fkey\" FOREIGN KEY (\"transactionDocumentId\") REFERENCES \"TransactionDocuments\"(id);",
  "ALTER TABLE \"TransactionDetails\" ADD CONSTRAINT \"TransactionDetails_transactionDocumentId_tenantId_fkey\" FOREIGN KEY (\"transactionDocumentId\", \"tenantId\") REFERENCES \"TransactionDocuments\"(id, \"tenantId\") ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"TransactionDocuments\" ADD CONSTRAINT \"TransactionDocuments_companyId_fkey\" FOREIGN KEY (\"companyId\") REFERENCES \"Companies\"(id) ON UPDATE CASCADE ON DELETE SET NULL;",
  "ALTER TABLE \"TransactionDocuments\" ADD CONSTRAINT \"TransactionDocuments_createdBy_fkey\" FOREIGN KEY (\"createdBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"TransactionDocuments\" ADD CONSTRAINT \"TransactionDocuments_documentId_fkey\" FOREIGN KEY (\"documentId\") REFERENCES \"Documents\"(id);",
  "ALTER TABLE \"TransactionDocuments\" ADD CONSTRAINT \"TransactionDocuments_handledBy_fkey\" FOREIGN KEY (\"handledBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"TransactionDocuments\" ADD CONSTRAINT \"TransactionDocuments_kindId_fkey\" FOREIGN KEY (\"kindId\") REFERENCES \"TransactionKinds\"(id) ON UPDATE CASCADE ON DELETE SET NULL;",
  "ALTER TABLE \"TransactionDocuments\" ADD CONSTRAINT \"TransactionDocuments_taskId_fkey\" FOREIGN KEY (\"taskId\") REFERENCES \"Tasks\"(id) ON UPDATE CASCADE ON DELETE SET NULL;",
  "ALTER TABLE \"TransactionDocuments\" ADD CONSTRAINT \"TransactionDocuments_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"TransactionDocuments\" ADD CONSTRAINT \"TransactionDocuments_updatedBy_fkey\" FOREIGN KEY (\"updatedBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"TransactionDocuments\" ADD CONSTRAINT \"TransactionDocuments_voucherId_fkey\" FOREIGN KEY (\"voucherId\") REFERENCES \"Vouchers\"(id) ON UPDATE CASCADE ON DELETE SET NULL;",
  "ALTER TABLE \"TransactionKinds\" ADD CONSTRAINT \"TransactionKinds_bookId_fkey\" FOREIGN KEY (\"bookId\") REFERENCES \"VoucherClasses\"(id) ON UPDATE CASCADE ON DELETE SET NULL;",
  "ALTER TABLE \"TransactionKinds\" ADD CONSTRAINT \"TransactionKinds_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"VoucherClasses\" ADD CONSTRAINT \"VoucherClasses_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"VoucherFiles\" ADD CONSTRAINT \"VoucherFiles_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"VoucherFiles\" ADD CONSTRAINT \"VoucherFiles_voucherId_fkey\" FOREIGN KEY (\"voucherId\") REFERENCES \"Vouchers\"(id) ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"VoucherFiles\" ADD CONSTRAINT \"VoucherFiles_voucherId_tenantId_fkey\" FOREIGN KEY (\"voucherId\", \"tenantId\") REFERENCES \"Vouchers\"(id, \"tenantId\") ON UPDATE CASCADE ON DELETE CASCADE;",
  "ALTER TABLE \"Vouchers\" ADD CONSTRAINT \"Vouchers_companyId_fkey\" FOREIGN KEY (\"companyId\") REFERENCES \"Companies\"(id) ON UPDATE CASCADE ON DELETE SET NULL;",
  "ALTER TABLE \"Vouchers\" ADD CONSTRAINT \"Vouchers_createdBy_fkey\" FOREIGN KEY (\"createdBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Vouchers\" ADD CONSTRAINT \"Vouchers_taxRuleId_fkey\" FOREIGN KEY (\"taxRuleId\") REFERENCES \"TaxRules\"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;",
  "ALTER TABLE \"Vouchers\" ADD CONSTRAINT \"Vouchers_tenantId_fkey\" FOREIGN KEY (\"tenantId\") REFERENCES \"Tenants\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Vouchers\" ADD CONSTRAINT \"Vouchers_updatedBy_fkey\" FOREIGN KEY (\"updatedBy\") REFERENCES \"Users\"(id) ON UPDATE CASCADE ON DELETE RESTRICT;",
  "ALTER TABLE \"Vouchers\" ADD CONSTRAINT \"Vouchers_voucherClassId_fkey\" FOREIGN KEY (\"voucherClassId\") REFERENCES \"VoucherClasses\"(id) ON UPDATE CASCADE ON DELETE SET NULL;",
  "CREATE INDEX account_classes_tenant_id ON public.\"AccountClasses\" USING btree (\"tenantId\");",
  "CREATE INDEX account_remainings_tenant_id ON public.\"AccountRemainings\" USING btree (\"tenantId\");",
  "CREATE INDEX accounts_tenant_id ON public.\"Accounts\" USING btree (\"tenantId\");",
  "CREATE INDEX audit_events_entity_idx ON public.\"AuditEvents\" USING btree (((payload ->> 'entityType'::text)), ((payload ->> 'entityId'::text)));",
  "CREATE INDEX audit_events_tenant_action_created_idx ON public.\"AuditEvents\" USING btree (\"tenantId\", action, \"createdAt\");",
  "CREATE INDEX companies_tenant_id ON public.\"Companies\" USING btree (\"tenantId\");",
  "CREATE UNIQUE INDEX \"CompanyClasses_tenantId_name_unique\" ON public.\"CompanyClasses\" USING btree (\"tenantId\", name);",
  "CREATE INDEX company_classes_tenant_id ON public.\"CompanyClasses\" USING btree (\"tenantId\");",
  "CREATE INDEX cross_slip_details_tenant_id ON public.\"CrossSlipDetails\" USING btree (\"tenantId\");",
  "CREATE INDEX cross_slips_tenant_id ON public.\"CrossSlips\" USING btree (\"tenantId\");",
  "CREATE INDEX document_files_tenant_id ON public.\"DocumentFiles\" USING btree (\"tenantId\");",
  "CREATE INDEX documents_tenant_id ON public.\"Documents\" USING btree (\"tenantId\");",
  "CREATE INDEX fiscal_years_tenant_id ON public.\"FiscalYears\" USING btree (\"tenantId\");",
  "CREATE INDEX item_classes_tenant_id ON public.\"ItemClasses\" USING btree (\"tenantId\");",
  "CREATE INDEX items_tenant_id ON public.\"Items\" USING btree (\"tenantId\");",
  "CREATE INDEX label_accounts_account_id ON public.\"LabelAccounts\" USING btree (\"accountId\");",
  "CREATE INDEX label_accounts_tenant_id ON public.\"LabelAccounts\" USING btree (\"tenantId\");",
  "CREATE INDEX labels_tenant_id ON public.\"Labels\" USING btree (\"tenantId\");",
  "CREATE INDEX menus_tenant_id ON public.\"Menus\" USING btree (\"tenantId\");",
  "CREATE INDEX monthly_logs_tenant_id ON public.\"MonthlyLogs\" USING btree (\"tenantId\");",
  "CREATE INDEX project_labels_tenant_id ON public.\"ProjectLabels\" USING btree (\"tenantId\");",
  "CREATE INDEX projects_tenant_id ON public.\"Projects\" USING btree (\"tenantId\");",
  "CREATE INDEX simulation_assumptions_scenario_status_idx ON public.\"SimulationAssumptions\" USING btree (\"scenarioId\", status);",
  "CREATE INDEX simulation_assumptions_tenant_scenario_type_idx ON public.\"SimulationAssumptions\" USING btree (\"tenantId\", \"scenarioId\", type);",
  "CREATE INDEX simulation_entries_scenario_idx ON public.\"SimulationEntries\" USING btree (\"scenarioId\");",
  "CREATE INDEX simulation_entries_tenant_idx ON public.\"SimulationEntries\" USING btree (\"tenantId\");",
  "CREATE INDEX simulation_scenarios_tenant_owner_idx ON public.\"SimulationScenarios\" USING btree (\"tenantId\", \"ownerId\");",
  "CREATE INDEX simulation_scenarios_tenant_status_idx ON public.\"SimulationScenarios\" USING btree (\"tenantId\", status);",
  "CREATE INDEX stickies_tenant_id ON public.\"Stickies\" USING btree (\"tenantId\");",
  "CREATE INDEX sticky_statuses_sticky_id ON public.\"StickyStatuses\" USING btree (\"stickyId\");",
  "CREATE INDEX sticky_statuses_tenant_id ON public.\"StickyStatuses\" USING btree (\"tenantId\");",
  "CREATE INDEX sub_account_remainings_tenant_id ON public.\"SubAccountRemainings\" USING btree (\"tenantId\");",
  "CREATE INDEX sub_accounts_tenant_id ON public.\"SubAccounts\" USING btree (\"tenantId\");",
  "CREATE INDEX task_details_tenant_id ON public.\"TaskDetails\" USING btree (\"tenantId\");",
  "CREATE INDEX tasks_tenant_id ON public.\"Tasks\" USING btree (\"tenantId\");",
  "CREATE INDEX tax_rules_tenant_id ON public.\"TaxRules\" USING btree (\"tenantId\");",
  "CREATE UNIQUE INDEX \"Members_tenantId_userId_key\" ON public.\"TenantMembers\" USING btree (\"tenantId\", \"userId\") WHERE (\"userId\" IS NOT NULL);",
  "CREATE UNIQUE INDEX \"TenantMembers_userId_isDefault_unique\" ON public.\"TenantMembers\" USING btree (\"userId\") WHERE ((\"isDefault\" = true) AND (\"userId\" IS NOT NULL));",
  "CREATE INDEX members_tenant_id ON public.\"TenantMembers\" USING btree (\"tenantId\");",
  "CREATE INDEX tenantmembers_status_idx ON public.\"TenantMembers\" USING btree (status);",
  "CREATE INDEX tenantmembers_tenantid_idx ON public.\"TenantMembers\" USING btree (\"tenantId\");",
  "CREATE INDEX tenantmembers_userid_idx ON public.\"TenantMembers\" USING btree (\"userId\");",
  "CREATE INDEX tenantmembers_userid_isdefault_idx ON public.\"TenantMembers\" USING btree (\"userId\", \"isDefault\");",
  "CREATE UNIQUE INDEX tenantmembers_userid_tenantid_key ON public.\"TenantMembers\" USING btree (\"userId\", \"tenantId\") WHERE (\"userId\" IS NOT NULL);",
  "CREATE INDEX tenants_status ON public.\"Tenants\" USING btree (status);",
  "CREATE INDEX transaction_details_tenant_id ON public.\"TransactionDetails\" USING btree (\"tenantId\");",
  "CREATE INDEX transaction_documents_tenant_id ON public.\"TransactionDocuments\" USING btree (\"tenantId\");",
  "CREATE INDEX transaction_kinds_tenant_id ON public.\"TransactionKinds\" USING btree (\"tenantId\");",
  "CREATE UNIQUE INDEX translations_system_unique ON public.\"Translations\" USING btree (\"tableName\", \"recordKey\", field, language) WHERE (\"tenantId\" IS NULL);",
  "CREATE INDEX translations_table_lang_idx ON public.\"Translations\" USING btree (\"tableName\", language);",
  "CREATE UNIQUE INDEX translations_tenant_unique ON public.\"Translations\" USING btree (\"tableName\", \"recordKey\", field, language, \"tenantId\") WHERE (\"tenantId\" IS NOT NULL);",
  "CREATE INDEX voucher_classes_tenant_id ON public.\"VoucherClasses\" USING btree (\"tenantId\");",
  "CREATE INDEX voucher_files_tenant_id ON public.\"VoucherFiles\" USING btree (\"tenantId\");",
  "CREATE INDEX vouchers_tenant_id ON public.\"Vouchers\" USING btree (\"tenantId\");",
  "CREATE INDEX \"IDX_session_expire\" ON public.session USING btree (expire);"
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fail-fast guard: ensure DB has zero product tables
    const [existingTables] = await queryInterface.sequelize.query(`
      SELECT count(*)::int as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE' 
        AND table_name <> 'SequelizeMeta'
    `);
    
    if (existingTables[0].count > 0) {
      throw new Error(
        'Fresh-DB-only baseline migration failed: target database is not empty (' + 
        existingTables[0].count + ' existing tables found). ' +
        'This migration requires a fresh database reset.'
      );
    }

    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query('SET search_path = public;', { transaction: t });
      for (const statement of STATEMENTS) {
        await queryInterface.sequelize.query(statement, { transaction: t });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "AccountClasses" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "AccountRemainings" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Accounts" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "AuditEvents" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Companies" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "CompanyClasses" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "CrossSlipDetails" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "CrossSlips" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "DocumentFiles" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Documents" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "FiscalYears" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "ItemClasses" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Items" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "LabelAccounts" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Labels" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "MemberClasses" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Menus" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "MonthlyLogs" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "ProjectLabels" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Projects" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "SimulationAssumptions" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "SimulationEntries" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "SimulationScenarios" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Stickies" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "StickyStatuses" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "SubAccountRemainings" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "SubAccounts" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "TaskDetails" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Tasks" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "TaxRules" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "TenantMembers" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Tenants" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "TransactionDetails" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "TransactionDocuments" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "TransactionKinds" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Translations" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Users" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "VoucherClasses" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "VoucherFiles" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Vouchers" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "session" CASCADE;', { transaction: t });

  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "AccountClasses_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "AccountRemainings_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "Accounts_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "AuditEvents_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "Companies_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "CompanyClasses_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "CrossSlipDetails_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "CrossSlips_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "DocumentFiles_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "Documents_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "FiscalYears_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "ItemClasses_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "Items_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "Labels_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "MemberClasses_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "Members_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "Menus_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "MonthlyLogs_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "Projects_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "SimulationAssumptions_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "SimulationEntries_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "SimulationScenarios_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "Stickies_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "StickyStatuses_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "SubAccountRemainings_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "SubAccounts_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "TaskDetails_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "Tasks_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "TaxRules_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "Tenants_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "TransactionDetails_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "TransactionDocuments_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "TransactionKinds_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "Translations_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "Users_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "VoucherClasses_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "VoucherFiles_id_seq" CASCADE;', { transaction: t });
  await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "Vouchers_id_seq" CASCADE;', { transaction: t });
    });
  }
};
