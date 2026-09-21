"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Link as LinkIcon, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type ArticleImportProps = {
  courseId: string;
};

export default function ArticleImport({ courseId }: ArticleImportProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error("Please enter a valid article URL.");
      return;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("URL must start with http:// or https://");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/materials/import-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim(), courseId }),
      });

      const data = (await response.json()) as { error?: string; success?: boolean };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to import article.");
      }

      toast.success("Article imported and prepared successfully!");
      setUrl("");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-950">Import Web Article</h3>
          <p className="text-xs text-gray-500">
            Paste a web link (Wikipedia, documentation, blogs) to extract and format its contents.
          </p>
        </div>
      </div>

      <form onSubmit={handleImport} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <LinkIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            placeholder="https://en.wikipedia.org/wiki/Artificial_intelligence"
            className="block w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-950 placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            "Import Article"
          )}
        </button>
      </form>
    </section>
  );
}
