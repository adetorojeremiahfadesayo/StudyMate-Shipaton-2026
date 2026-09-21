"use client";

import { useMemo, useState } from "react";
import { Check, PencilLine, RotateCcw, Save } from "lucide-react";
import toast from "react-hot-toast";
import NoteViewer from "./NoteViewer";

type NoteEditorProps = {
  content: string;
  onSave: (content: string) => Promise<void>;
};

export default function NoteEditor({ content, onSave }: NoteEditorProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draft, setDraft] = useState(content);
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(() => draft.trim() !== content.trim(), [content, draft]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      toast.success("Notes saved.");
      setMode("view");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save notes.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(content);
    setMode("view");
  };

  if (mode === "edit") {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">Edit notes</h2>
            <p className="mt-1 text-sm text-gray-500">Editing your notes won&apos;t affect the wiki.</p>
          </div>

          <button
            type="button"
            onClick={() => setMode("view")}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-violet-200 hover:text-violet-700"
          >
            <Check className="h-4 w-4" />
            View mode
          </button>
        </div>

        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="mt-5 min-h-[60vh] w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-7 text-gray-900 outline-none ring-0 transition focus:border-violet-300 focus:bg-white"
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-950"
          >
            <RotateCcw className="h-4 w-4" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save notes"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-950">Study notes</h2>
          <p className="mt-1 text-sm text-gray-500">Use the view mode for reading, or switch to edit mode to refine the markdown.</p>
        </div>

        <button
          type="button"
          onClick={() => setMode("edit")}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-violet-200 hover:text-violet-700"
        >
          <PencilLine className="h-4 w-4" />
          Edit notes
        </button>
      </div>

      <NoteViewer content={content} />
    </section>
  );
}
