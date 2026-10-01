import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from "@/lib/route-helpers";
import { getDisplayName } from "@/lib/course-utils";
import { fetchReportData } from "@/lib/report-data";
import { buildStudyReportPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase(request);
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user } = authenticated;
    const body = (await request.json()) as { courseId?: string };
    if (!body.courseId) {
      return NextResponse.json({ error: "Missing course ID." }, { status: 400 });
    }

    const report = await fetchReportData({
      courseId: body.courseId,
      userId: user.id,
      studentName: getDisplayName(user.user_metadata?.full_name, user.email),
    });

    const { doc, fileName } = buildStudyReportPdf({
      course: report.course,
      studentName: report.studentName,
      generatedAt: new Date().toISOString(),
      readinessScore: report.readinessScore,
      readinessBreakdown: report.readinessBreakdown,
      materials: report.materials,
      notes: report.notes,
      keyPoints: report.keyPoints,
      pastQuestions: report.pastQuestions,
      aocAnswers: report.aocAnswers,
      flashcards: report.flashcards,
      quizAttempts: report.quizAttempts,
      wikiCountsByType: report.wikiCountsByType,
    });

    const buffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
