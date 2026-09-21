import Link from "next/link";
import { FileText } from "lucide-react";
import { formatDate, getSubjectMeta } from "@/lib/course-utils";

type CourseCardProps = {
  id: string;
  name: string;
  subjectType: string;
  materialsCount: number;
  createdAt: string;
};

export default function CourseCard({
  id,
  name,
  subjectType,
  materialsCount,
  createdAt,
}: CourseCardProps) {
  const subject = getSubjectMeta(subjectType);

  return (
    <Link
      href={materialsCount > 0 ? `/courses/${id}/learn` : `/courses/${id}/materials`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-gray-950">{name}</h3>
          <div
            className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${subject.badge}`}
          >
            {subject.label}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600">
        <div className="inline-flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <span>{materialsCount} material{materialsCount === 1 ? "" : "s"}</span>
        </div>
        <span>{formatDate(createdAt)}</span>
      </div>

      <p className="mt-3 text-sm text-gray-500 transition group-hover:text-gray-700">
        {materialsCount > 0 ? "Continue learning" : "Upload material"}
      </p>
    </Link>
  );
}
