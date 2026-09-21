"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const subjectOptions = [
  { value: "law", label: "Law" },
  { value: "engineering", label: "Engineering" },
  { value: "medicine", label: "Medicine" },
  { value: "economics", label: "Economics" },
  { value: "other", label: "Other" },
];

export default function NewCoursePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [subjectType, setSubjectType] = useState("law");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateCourse = async () => {
    setError("");

    if (!name.trim()) {
      setError("Course name is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/courses/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          subjectType,
          description: description.trim() || null,
        }),
      });

      const resData = (await response.json()) as { success?: boolean; id?: string; error?: string };
      if (!response.ok || !resData.success) {
        throw new Error(resData.error ?? "Failed to create course.");
      }

      toast.success("Course created.");
      router.push(`/courses/${resData.id}/materials`);
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : "Could not create course.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-950">Create New Course</h1>
        <p className="text-sm text-gray-600">
          Set up a course workspace before uploading notes and generating study material.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Course name</label>
            <div className="flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 focus-within:border-violet-400">
              <BookOpen className="h-4 w-4 text-violet-600" />
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Law of Tort"
                className="w-full bg-transparent text-sm text-gray-950 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Subject type</label>
            <select
              value={subjectType}
              onChange={(event) => setSubjectType(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950 outline-none focus:border-violet-400"
            >
              {subjectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Optional course description"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950 outline-none placeholder:text-gray-400 focus:border-violet-400"
            />
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button
            type="button"
            onClick={handleCreateCourse}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create Course
          </button>
        </div>
      </div>
    </section>
  );
}
