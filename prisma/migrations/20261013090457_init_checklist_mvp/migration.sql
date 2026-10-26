-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('PRE_ACTS', 'POST_ACTS');

-- CreateEnum
CREATE TYPE "audit_status" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "audit_result" AS ENUM ('READY', 'NEEDS_REVISION', 'BLOCKED', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "form_type" AS ENUM ('A_FORM', 'PPR', 'AR', 'SAS', 'GALS', 'LOP', 'MOA', 'LOE', 'NE', 'FRS', 'PUBLICITY', 'EVALUATION', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "evaluation_outcome" AS ENUM ('PASS', 'FAIL', 'NOT_APPLICABLE', 'NOT_EVALUATED', 'NEEDS_MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "finding_severity" AS ENUM ('BLOCKING', 'WARNING', 'INFO');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "google_subject" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "document_type" "document_type" NOT NULL,
    "form_type" "form_type" NOT NULL DEFAULT 'UNKNOWN',
    "filename" TEXT NOT NULL,
    "mime_type" VARCHAR(128) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "status" "audit_status" NOT NULL DEFAULT 'QUEUED',
    "input_snapshot" JSONB NOT NULL,
    "evaluation_results" JSONB NOT NULL DEFAULT '[]',
    "overall_result" "audit_result",
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "audit_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_documents" (
    "audit_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,

    CONSTRAINT "audit_documents_pkey" PRIMARY KEY ("audit_id","document_id")
);

-- CreateTable
CREATE TABLE "audit_findings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "audit_id" UUID NOT NULL,
    "outcome" "evaluation_outcome" NOT NULL,
    "severity" "finding_severity",
    "reason" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "reference" JSONB,
    "locations" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "audit_findings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_subject_key" ON "users"("google_subject");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "documents_storage_key_key" ON "documents"("storage_key");

-- CreateIndex
CREATE INDEX "documents_project_id_is_deleted_idx" ON "documents"("project_id", "is_deleted");

-- CreateIndex
CREATE INDEX "audit_runs_project_id_created_at_idx" ON "audit_runs"("project_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "audit_runs_one_active_per_project" ON "audit_runs"("project_id") WHERE (status IN ('QUEUED', 'PROCESSING'));

-- CreateIndex
CREATE INDEX "audit_documents_document_id_idx" ON "audit_documents"("document_id");

-- CreateIndex
CREATE INDEX "audit_findings_audit_id_idx" ON "audit_findings"("audit_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_runs" ADD CONSTRAINT "audit_runs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_documents" ADD CONSTRAINT "audit_documents_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audit_runs"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_documents" ADD CONSTRAINT "audit_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audit_runs"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
