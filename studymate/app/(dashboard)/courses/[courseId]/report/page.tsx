import { notFound } from "next/navigation";
import ReportPreview from "@/components/report/ReportPreview";
import ReportDownloadButton from "@/components/report/ReportDownloadButton";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { fetchReportData } from "@/lib/report-data";
import { getDisplayName } from "@/lib/course-utils";
import { normalizeEducationLevel } from "@/lib/learning-profile";

export const dynamic = "force-dynamic";

type ReportPageProps = {
  params: Promise<{ courseId: string }>;
};

async function loadReport(
  courseId: string,
  userId: string,
  studentName: string,
  educationLevel: "primary" | "secondary" | "tertiary",
) {
  try {
    return await fetchReportData({
      courseId,
      userId,
      studentName,
      educationLevel,
    });
  } catch {
    return null;
  }
}

export default async function CourseReportPage({ params }: ReportPageProps) {
  const { courseId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user) {
    notFound();
  }
  const educationLevel = normalizeEducationLevel(user.user_metadata?.education_level) ?? "tertiary";

  const report = await loadReport(
    courseId,
    user.id,
    getDisplayName(user.user_metadata?.full_name, user.email),
    educationLevel,
  );

  if (!report) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-400">Revision PDF Reward</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950">{report.course.name}</h1>
          <p className="max-w-2xl text-sm text-gray-600">
            Download an exam-ready revision pack from your uploads, explanations, practice answers, key points, and flashcards.
          </p>
        </div>

        <ReportDownloadButton courseId={courseId} courseName={report.course.name} />
      </div>

      <ReportPreview
        courseName={report.course.name}
        subjectType={report.course.subject_type}
        studentName={report.studentName}
        generatedAt={new Date().toISOString()}
        readinessScore={report.readinessScore}
        readinessBreakdown={report.readinessBreakdown}
        materials={report.materials}
        wikiCountsByType={report.wikiCountsByType}
        notesCount={report.notes?.content?.trim() ? 1 : 0}
        keyPoints={report.keyPoints}
        pastQuestions={report.pastQuestions}
        aocAnswers={report.aocAnswers}
        quizAttempts={report.quizAttempts}
        flashcards={report.flashcards}
      />
    </section>
  );
}
