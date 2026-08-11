import { getPayloadClient } from "@/lib/payload";
import type { Lesson, LessonMaterial, Module, Subject } from "@/payload/payload-types";

export async function getSubjects(): Promise<Subject[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "subjects",
    sort: "order",
    limit: 100,
  });
  return result.docs;
}

export async function getSubjectBySlug(slug: string): Promise<Subject | null> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "subjects",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  return result.docs[0] ?? null;
}

export async function getModulesBySubject(subjectId: number): Promise<Module[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "modules",
    where: { subject: { equals: subjectId } },
    sort: "order",
    limit: 100,
  });
  return result.docs;
}

export async function getLessonsByModule(moduleId: number): Promise<Lesson[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "lessons",
    where: {
      module: { equals: moduleId },
      published: { equals: true },
    },
    sort: "order",
    limit: 100,
  });
  return result.docs;
}

export async function getLessonBySlug(slug: string): Promise<Lesson | null> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "lessons",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  });
  return result.docs[0] ?? null;
}

export async function getLessonMaterials(lessonId: number): Promise<LessonMaterial[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "lesson-materials",
    where: { lesson: { equals: lessonId } },
    limit: 50,
    depth: 1,
  });
  return result.docs;
}
