/*
  Warnings:

  - A unique constraint covering the columns `[component]` on the table `section_types` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "section_types_component_key" ON "section_types"("component");
