import { notFound } from "next/navigation";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import UploadZone from "@/components/materials/UploadZone";
import ArticleImport from "@/components/materials/ArticleImport";
import FileList from "@/components/materials/FileList";
import MaterialsAutoRefresh from "@/components/materials/MaterialsAutoRefresh";
import BuildWikiButton from "@/components/wiki/BuildWikiButton";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DEMO_USER, IS_DEMO_MODE } from "@/lib/demo-auth";
import type { Material } from "@/types";

export const dynamic = "force-dynamic";

type MaterialsPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseMaterialsPage({ params }: MaterialsPageProps) {
  const { courseId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user.id ?? DEMO_USER.id;
  if (!userId) {
    notFound();
  }

  const { data: ownedCourse, error: courseError } = await supabase
    .from("courses")
    .select("id, name, subject_type")
    .eq("id", courseId)
    .eq("user_id", userId)
    .maybeSingle();

  if ((courseError || !ownedCourse) && !IS_DEMO_MODE) {
    notFound();
  }

  const [materialsResponse, wikiCountResponse] = await Promise.all([
    supabase
      .from("materials")
      .select(
        "id, course_id, file_name, file_url, file_type, file_size, storage_path, mime_type, ocr_status, ocr_progress, ocr_text, error_message, indexed, created_at",
      )
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
    supabase.from("wiki_pages").select("id", { count: "exact", head: true }).eq("course_id", courseId),
  ]);

  let { data: materials, error: materialsError } = materialsResponse;

  if (materialsError?.message.toLowerCase().includes("ocr_progress")) {
    const fallbackResponse = await supabase
      .from("materials")
      .select(
        "id, course_id, file_name, file_url, file_type, file_size, storage_path, mime_type, ocr_status, ocr_text, error_message, indexed, created_at",
      )
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    materials = fallbackResponse.data?.map((material) => ({
      ...material,
      ocr_progress:
        material.ocr_status === "complete" || material.ocr_status === "failed"
          ? 100
          : material.ocr_status === "processing" || material.ocr_status === "queued"
            ? 60
            : 0,
    })) ?? null;
    materialsError = fallbackResponse.error;
  }

  const materialList = materialsError ? [] : ((materials ?? []) as Material[]);
  const totalMaterials = materialList.length;
  const indexedMaterials = materialList.filter((material) => material.indexed).length;
  const queuedMaterials = materialList.filter((material) => material.ocr_status === "queued").length;
  const readyMaterials = materialList.filter((material) => material.ocr_status === "complete").length;
  const processingMaterials = materialList.filter((material) => material.ocr_status === "processing").length;
  const failedMaterials = materialList.filter((material) => material.ocr_status === "failed").length;
  const activeMaterials = queuedMaterials + processingMaterials;
  const progressPercent = totalMaterials > 0 ? Math.round((readyMaterials / totalMaterials) * 100) : 0;
  const wikiPagesCount = wikiCountResponse.error ? 0 : wikiCountResponse.count ?? 0;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-950">Upload Material</h1>
        <p className="text-sm text-gray-600">
          Drop your course material here so StudyMate can turn it into explanations, exam practice, flashcards, and a revision PDF.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Upload progress</p>
            <p className="mt-1 text-lg font-semibold text-gray-950">
              {readyMaterials} of {totalMaterials || 0} documents ready
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {activeMaterials > 0
                ? `${queuedMaterials} queued, ${processingMaterials} processing.`
                : failedMaterials > 0
                  ? `${failedMaterials} failed and may need a retry.`
                  : "Everything uploaded is ready."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14">
              <svg className="h-14 w-14 -rotate-90 transform" viewBox="0 0 56 56" aria-hidden="true">
                <circle cx="28" cy="28" r="22" className="fill-none stroke-gray-200" strokeWidth="6" />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  className="fill-none stroke-violet-600 transition-all duration-500"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - progressPercent / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-950">
                {progressPercent}%
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-slate-500" />
                Queued {queuedMaterials}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Ready {readyMaterials}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                Processing {processingMaterials}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <CircleAlert className="h-4 w-4 text-rose-500" />
                Failed {failedMaterials}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <MaterialsAutoRefresh activeCount={activeMaterials} />

      <div className="grid gap-6 md:grid-cols-2">
        <UploadZone courseId={courseId} />
        <ArticleImport courseId={courseId} />
      </div>

      <FileList materials={materialList} />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">Learning Source Status</p>
            <h2 className="text-xl font-semibold text-gray-950">{wikiPagesCount} source page{wikiPagesCount === 1 ? "" : "s"}</h2>
            <p className="max-w-2xl text-sm text-gray-600">
              Prepare your uploaded material so Plain Mode, Story Mode, Exam Prep, and the revision PDF can all use it.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Indexed materials: <span className="font-semibold text-gray-950">{indexedMaterials}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <BuildWikiButton
            courseId={courseId}
            disabled={indexedMaterials === 0}
            className="flex-1"
            label={indexedMaterials === 0 ? "Upload and finish OCR first" : "Prepare Learning Source"}
          />
          {wikiPagesCount > 0 && (
            <a
              href={`/courses/${courseId}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Continue to Dashboard
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
