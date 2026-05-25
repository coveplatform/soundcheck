-- Track of the Day: editorial fields on ChartSubmission

ALTER TABLE "ChartSubmission"
  ADD COLUMN "editorNote" TEXT,
  ADD COLUMN "editorNoteByline" TEXT,
  ADD COLUMN "editorNoteGeneratedAt" TIMESTAMP(3),
  ADD COLUMN "editorNoteEditedAt" TIMESTAMP(3);
