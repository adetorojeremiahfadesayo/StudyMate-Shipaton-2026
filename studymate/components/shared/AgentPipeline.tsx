import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

type PipelineStatus = "done" | "active" | "queued";

export type PipelineStep = {
  id: string;
  label: string;
  detail: string;
  model: string;
  status: PipelineStatus;
};

type AgentPipelineProps = {
  title: string;
  subtitle: string;
  currentModel: string;
  currentMessage: string;
  steps: PipelineStep[];
};

function StatusIcon({ status }: { status: PipelineStatus }) {
  if (status === "done") {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  if (status === "active") {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return <Sparkles className="h-4 w-4" />;
}

export default function AgentPipeline({
  title,
  subtitle,
  currentModel,
  currentMessage,
  steps,
}: AgentPipelineProps) {
  const completedCount = steps.filter((step) => step.status === "done").length;
  const activeStep = steps.find((step) => step.status === "active") ?? steps[0] ?? null;

  return (
    <section className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            Live Agent Pipeline
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-950">{title}</h2>
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-white p-4 text-sm shadow-sm">
          <div className="flex items-center gap-2 text-violet-700">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">Current model</span>
          </div>
          <p className="font-medium text-gray-900">{currentModel}</p>
          <p className="max-w-md text-gray-600">{currentMessage}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const isDone = step.status === "done";
          const isActive = step.status === "active";

          return (
            <div
              key={step.id}
              className={`rounded-2xl border p-4 transition ${
                isActive
                  ? "border-violet-300 bg-white shadow-md shadow-violet-100"
                  : isDone
                    ? "border-emerald-100 bg-emerald-50/60"
                    : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    isActive
                      ? "bg-violet-700 text-white"
                      : isDone
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <StatusIcon status={step.status} />
                </div>
                <span className="text-xs font-medium text-gray-400">{String(index + 1).padStart(2, "0")}</span>
              </div>

              <h3 className="mt-4 text-sm font-semibold text-gray-950">{step.label}</h3>
              <p className="mt-1 text-xs leading-5 text-gray-600">{step.detail}</p>
              <div className="mt-3 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                {step.model}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm">
        <p className="text-gray-600">
          {completedCount} of {steps.length} pipeline stages complete
        </p>
        {activeStep ? (
          <p className="font-medium text-gray-900">
            Active stage: <span className="text-violet-700">{activeStep.label}</span>
          </p>
        ) : null}
      </div>
    </section>
  );
}
