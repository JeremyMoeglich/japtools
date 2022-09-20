-- CreateEnum
CREATE TYPE "ReadingType" AS ENUM ('ONYOMI', 'KUNYOMI', 'NANORI');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('KANJI', 'VOCABULARY', 'RADICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "email" STRING NOT NULL,
    "password_hash" STRING NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress_id" STRING NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginToken" (
    "id" STRING NOT NULL,
    "user_id" STRING NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" STRING NOT NULL,

    CONSTRAINT "LoginToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectProgress" (
    "subject_id" INT4 NOT NULL,
    "level" INT4 NOT NULL,
    "skill_level" INT4 NOT NULL DEFAULT 0,
    "next_review" TIMESTAMP(3) NOT NULL,
    "progress_id" STRING NOT NULL
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" STRING NOT NULL,
    "current_level" INT4 NOT NULL DEFAULT 1,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectMeaning" (
    "id" STRING NOT NULL,
    "accepted_answer" BOOL NOT NULL,
    "meaning" STRING NOT NULL,
    "primary" BOOL NOT NULL,
    "radicalSubjectId" INT4,
    "kanjiSubjectId" INT4,
    "vocabularySubjectId" INT4,

    CONSTRAINT "SubjectMeaning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuxiliaryMeaning" (
    "id" STRING NOT NULL,
    "meaning" STRING NOT NULL,
    "auxiliary_type" STRING NOT NULL,
    "radicalSubjectId" INT4,
    "kanjiSubjectId" INT4,
    "vocabularySubjectId" INT4,

    CONSTRAINT "AuxiliaryMeaning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KanjiReading" (
    "id" STRING NOT NULL,
    "reading" STRING NOT NULL,
    "reading_type" "ReadingType" NOT NULL,
    "primary" BOOL NOT NULL,
    "kanjiSubjectId" INT4,

    CONSTRAINT "KanjiReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyReading" (
    "id" STRING NOT NULL,
    "reading" STRING NOT NULL,
    "primary" BOOL NOT NULL,
    "accepted_answer" BOOL NOT NULL,
    "vocabularySubjectId" INT4,

    CONSTRAINT "VocabularyReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectIndex" (
    "subject_type" "SubjectType" NOT NULL,
    "subjectId" INT4 NOT NULL,
    "readings" STRING[],
    "level" INT4 NOT NULL,

    CONSTRAINT "SubjectIndex_pkey" PRIMARY KEY ("subjectId")
);

-- CreateTable
CREATE TABLE "RadicalSubject" (
    "id" INT4 NOT NULL,
    "amalgamation_subject_ids" INT4[],
    "characters" STRING,
    "lesson_position" INT4 NOT NULL,
    "level" INT4 NOT NULL,
    "meaning_mnemonic" STRING NOT NULL,
    "image_url" STRING,

    CONSTRAINT "RadicalSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KanjiSubject" (
    "id" INT4 NOT NULL,
    "amalgamation_subject_ids" INT4[],
    "characters" STRING NOT NULL,
    "component_subject_ids" INT4[],
    "lesson_position" INT4 NOT NULL,
    "level" INT4 NOT NULL,
    "meaning_hint" STRING,
    "meaning_mnemonic" STRING NOT NULL,
    "reading_hint" STRING NOT NULL,
    "reading_mnemonic" STRING NOT NULL,
    "visually_similar_subject_ids" INT4[],

    CONSTRAINT "KanjiSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextSentence" (
    "id" STRING NOT NULL,
    "en" STRING NOT NULL,
    "ja" STRING NOT NULL,
    "vocabularySubjectId" INT4,

    CONSTRAINT "ContextSentence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularySubject" (
    "id" INT4 NOT NULL,
    "characters" STRING NOT NULL,
    "component_subject_ids" INT4[],
    "lesson_position" INT4 NOT NULL,
    "level" INT4 NOT NULL,
    "meaning_mnemonic" STRING NOT NULL,
    "reading_mnemonic" STRING NOT NULL,

    CONSTRAINT "VocabularySubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LoginToken_user_id_key" ON "LoginToken"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "LoginToken_value_key" ON "LoginToken"("value");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectProgress_subject_id_progress_id_key" ON "SubjectProgress"("subject_id", "progress_id");

-- CreateIndex
CREATE UNIQUE INDEX "KanjiSubject_characters_key" ON "KanjiSubject"("characters");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_progress_id_fkey" FOREIGN KEY ("progress_id") REFERENCES "Progress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectProgress" ADD CONSTRAINT "SubjectProgress_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "SubjectIndex"("subjectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectProgress" ADD CONSTRAINT "SubjectProgress_progress_id_fkey" FOREIGN KEY ("progress_id") REFERENCES "Progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectMeaning" ADD CONSTRAINT "SubjectMeaning_radicalSubjectId_fkey" FOREIGN KEY ("radicalSubjectId") REFERENCES "RadicalSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectMeaning" ADD CONSTRAINT "SubjectMeaning_kanjiSubjectId_fkey" FOREIGN KEY ("kanjiSubjectId") REFERENCES "KanjiSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectMeaning" ADD CONSTRAINT "SubjectMeaning_vocabularySubjectId_fkey" FOREIGN KEY ("vocabularySubjectId") REFERENCES "VocabularySubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuxiliaryMeaning" ADD CONSTRAINT "AuxiliaryMeaning_radicalSubjectId_fkey" FOREIGN KEY ("radicalSubjectId") REFERENCES "RadicalSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuxiliaryMeaning" ADD CONSTRAINT "AuxiliaryMeaning_kanjiSubjectId_fkey" FOREIGN KEY ("kanjiSubjectId") REFERENCES "KanjiSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuxiliaryMeaning" ADD CONSTRAINT "AuxiliaryMeaning_vocabularySubjectId_fkey" FOREIGN KEY ("vocabularySubjectId") REFERENCES "VocabularySubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanjiReading" ADD CONSTRAINT "KanjiReading_kanjiSubjectId_fkey" FOREIGN KEY ("kanjiSubjectId") REFERENCES "KanjiSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyReading" ADD CONSTRAINT "VocabularyReading_vocabularySubjectId_fkey" FOREIGN KEY ("vocabularySubjectId") REFERENCES "VocabularySubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextSentence" ADD CONSTRAINT "ContextSentence_vocabularySubjectId_fkey" FOREIGN KEY ("vocabularySubjectId") REFERENCES "VocabularySubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
