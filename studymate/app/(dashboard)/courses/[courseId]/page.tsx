import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  FileText,
  NotebookTabs,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import CourseProgressMap from "@/components/shared/CourseProgressMap";
import { StudyActionPanel } from "@/components/shared/StudyActionPanel";
import WeakAreasPanel from "@/components/shared/WeakAreasPanel";
import { DEMO_COURSE } from "@/lib/demo-data";
import { IS_DEMO_MODE } from "@/lib/demo-auth";
import { getCourseCoachSummary } from "@/lib/course-coach-data";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { formatDate, getSubjectMeta } from "@/lib/course-utils";
import { getCourseProgressSteps, getCourseReadiness, getStudyActions, getWeakAreas } from "@/lib/study-recommendations";

export const dynamic = "force-dynamic";

type CoursePageProps = {
  params: Promise<{ courseId: string }>;
};

function TabLink({
  href,
  label,
  icon: Icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-violet-200 bg-violet-100 text-violet-700"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export default async function CourseOverviewPage({ params }: CoursePageProps) {
  const { courseId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user.id;
  if (!userId && !IS_DEMO_MODE) {
    notFound();
  }

  const coachSummary = await getCourseCoachSummary(userId, courseId);

  const { data: course, error } = await supabase
    .from("courses")
    .select("id, name, subject_type, description, created_at")
    .eq("id", courseId)
    .eq("user_id", userId)
    .maybeSingle();

  if ((error || !course) && !coachSummary) {
    notFound();
  }

  const resolvedCourse = course ?? {
    id: coachSummary?.id ?? DEMO_COURSE.id,
    name: coachSummary?.name ?? DEMO_COURSE.name,
    subject_type: coachSummary?.subjectType ?? DEMO_COURSE.subject_type,
    description: coachSummary?.description ?? DEMO_COURSE.description,
    created_at: coachSummary?.createdAt ?? DEMO_COURSE.created_at,
  };
  const subject = getSubjectMeta(resolvedCourse.subject_type);
  const metrics = coachSummary?.metrics;
  const bestAction = coachSummary ? getStudyActions(coachSummary)[0] : null;
  const readiness = coachSummary ? getCourseReadiness(coachSummary).overall : 0;
  const weakAreas = coachSummary ? getWeakAreas(coachSummary) : [];

  const tabs = [
    { label: "Overview", href: `/courses/${courseId}`, icon: NotebookTabs, active: true },
    { label: "Upload", href: `/courses/${courseId}/materials`, icon: FileText },
    { label: "Learn", href: `/courses/${courseId}/learn`, icon: BookOpen },
    { label: "Exam Prep", href: `/courses/${courseId}/exam-prep`, icon: Sparkles },
    { label: "Revision PDF", href: `/courses/${courseId}/report`, icon: WandSparkles },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${subject.badge}`}>
              {subject.label}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-950">{resolvedCourse.name}</h1>
            <p className="max-w-2xl text-sm text-gray-600">
              {resolvedCourse.description || "Upload material, learn it in Plain or Story Mode, practice exam questions, then unlock a revision PDF."}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-600">
            Created {formatDate(resolvedCourse.created_at)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {tabs.map((tab) => (
            <TabLink key={tab.href} href={tab.href} label={tab.label} icon={tab.icon} active={tab.active} />
          ))}
        </div>
      </div>

      {bestAction ? <StudyActionPanel action={bestAction} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Materials</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{metrics?.materialsTotal ?? 0}</p>
          <p className="mt-2 text-sm text-gray-600">{metrics?.materialsReady ?? 0} ready for grounded study generation.</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Study sources</p>
            <p className="mt-2 text-3xl font-bold text-gray-950">{metrics?.wikiPagesCount ?? 0}</p>
          <p className="mt-2 text-sm text-gray-600">Structured pages powering Learn and Exam Prep.</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Readiness</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{readiness}%</p>
          <p className="mt-2 text-sm text-gray-600">
            {metrics?.notesCount
              ? "Generated notes are ready for this course."
              : "Readiness improves as sources, practice, and recall build up."}
          </p>
        </div>
      </div>

      {coachSummary ? <CourseProgressMap steps={getCourseProgressSteps(coachSummary)} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-gray-950">Source trust</h2>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              StudyMate answers are strongest when OCR is complete and the course wiki has been built from your uploaded materials.
              This course has {metrics?.materialsReady ?? 0} ready source{(metrics?.materialsReady ?? 0) === 1 ? "" : "s"} and {metrics?.wikiPagesCount ?? 0} wiki page{(metrics?.wikiPagesCount ?? 0) === 1 ? "" : "s"}.
            </p>
            <Link
              href={`/courses/${courseId}/wiki`}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
            >
              Inspect source wiki
            </Link>
          </div>
        </div>

        <WeakAreasPanel weakAreas={weakAreas} />
      </div>
    </section>
  );
}
