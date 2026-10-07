-- CreateTable
CREATE TABLE "training_modules" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "category_id" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_training_progress" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_training_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provider_training_progress_provider_id_module_id_key" ON "provider_training_progress"("provider_id", "module_id");

-- AddForeignKey
ALTER TABLE "training_modules" ADD CONSTRAINT "training_modules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_training_progress" ADD CONSTRAINT "provider_training_progress_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_training_progress" ADD CONSTRAINT "provider_training_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "training_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
