import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import CourseCard from "@/components/course/CourseCard";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: string;
  name: string;
  subject_type: string;
  created_at: string;
};

type MaterialRow = {
  course_id: string;
};

export default async function CoursesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user.id;

  const coursesResponse = userId
    ? await supabase.from("courses").select("id, name, subject_type, created_at").eq("user_id", userId)
    : { data: [], error: null };

  const courseIds = (coursesResponse.data ?? []).map((course) => course.id);
  const materialsResponse =
    userId && courseIds.length > 0
      ? await supabase.from("materials").select("course_id").in("course_id", courseIds)
      : { data: [], error: null };

  const courses = (coursesResponse.data ?? []) as CourseRow[];
  const materials = (materialsResponse.data ?? []) as MaterialRow[];

  const materialCounts = materials.reduce<Record<string, number>>((counts, material) => {
    counts[material.course_id] = (counts[material.course_id] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            <Sparkles className="h-3.5 w-3.5" />
            Study Flow
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-950">Upload, Learn, Practice</h1>
            <p className="mt-2 text-sm text-gray-600">
              Pick a course, upload material, learn it in Plain or Story Mode, then jump into Exam Prep.
            </p>
          </div>
        </div>

        <Link
          href="/courses/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
        >
          <Plus className="h-4 w-4" />
          New Upload
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-gray-950">Start with your first material</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
            Create a course, upload your notes or textbook pages, and StudyMate will build a source wiki, recommend weak-area drills, and package your revision PDF.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/courses/new"
              className="inline-flex items-center justify-center rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
            >
              Start Upload
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-xl border border-violet-100 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-700 transition hover:border-violet-200"
            >
              Try demo flow
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              id={course.id}
              name={course.name}
              subjectType={course.subject_type}
              materialsCount={materialCounts[course.id] ?? 0}
              createdAt={course.created_at}
            />
          ))}
        </div>
      )}
    </section>
  );
}
