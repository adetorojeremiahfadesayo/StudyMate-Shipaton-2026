import { Database, FileText } from "lucide-react";

type KnowledgeLayer = "foundry_iq" | "local_wiki_fallback" | "course_material" | string;

type SourcesUsedPanelProps = {
  sources: string[];
  knowledgeLayer?: KnowledgeLayer | null;
  compact?: boolean;
  confidenceLabel?: string;
};

function getLayerLabel(knowledgeLayer?: KnowledgeLayer | null) {
  if (knowledgeLayer === "foundry_iq") {
    return "Microsoft Foundry IQ";
  }

  if (knowledgeLayer === "local_wiki_fallback") {
    return "Local wiki fallback";
  }

  return "Course material";
}

export default function SourcesUsedPanel({
  sources,
  knowledgeLayer,
  compact = false,
  confidenceLabel,
}: SourcesUsedPanelProps) {
  const sourceTags = Array.from(new Set(sources.map((source) => source.trim()).filter(Boolean))).slice(0, 8);
  const layerLabel = getLayerLabel(knowledgeLayer);

  return (
    <aside className={`rounded-xl border border-cyan-100 bg-cyan-50/70 ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-cyan-700 shadow-sm">
          <Database className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-950">Sources used</p>
          <p className="mt-1 text-xs font-medium text-cyan-800">
            {layerLabel}
            {confidenceLabel ? ` · ${confidenceLabel}` : ""}
          </p>
        </div>
      </div>

      {sourceTags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {sourceTags.map((source) => (
            <span
              key={source}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-cyan-100 bg-white px-3 py-1 text-xs font-medium text-gray-700"
            >
              <FileText className="h-3 w-3 shrink-0 text-cyan-700" />
              <span className="truncate">{source}</span>
            </span>
          ))}
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm leading-6 text-gray-600">Grounded in uploaded course material.</p>
          <p className="mt-2 text-xs font-medium leading-5 text-cyan-800">
            Source trust improves when OCR is complete and the course wiki is built.
          </p>
        </>
      )}
    </aside>
  );
}
