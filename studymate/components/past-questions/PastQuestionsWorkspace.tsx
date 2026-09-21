"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Trash2,
  Trophy,
  Loader2,
  Sparkles,
  Send,
  Download,
  X,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";
import SourcesUsedPanel from "@/components/shared/SourcesUsedPanel";
import { awardStudyXp } from "@/lib/study-xp-client";
import type { ConfidenceLevel, EducationLevel, PastQuestion, SubjectType } from "@/types";
import { formatDate, getConfidenceMeta, getSubjectMeta } from "@/lib/course-utils";

type PastQuestionsWorkspaceProps = {
  courseId: string;
  courseName: string;
  subjectType: SubjectType;
  initialQuestions: PastQuestion[];
  educationLevel?: EducationLevel;
  initialStudyXp?: number;
  sourceNames?: string[];
};

export default function PastQuestionsWorkspace({
  courseId,
  courseName,
  subjectType,
  initialQuestions,
  educationLevel,
  initialStudyXp = 0,
  sourceNames = [],
}: PastQuestionsWorkspaceProps) {
  const router = useRouter();
  const subjectMeta = getSubjectMeta(subjectType);

  const [history, setHistory] = useState<PastQuestion[]>(initialQuestions);
  const [storyXp, setStoryXp] = useState(initialStudyXp);
  const [topicInput, setTopicInput] = useState("");

  // Simulator state machine
  const [scenarioState, setScenarioState] = useState<"idle" | "generating" | "active" | "grading" | "finished">("idle");
  const [scenarioData, setScenarioData] = useState<{ topic: string; scenario: string } | null>(null);
  const [activeStep, setActiveStep] = useState<"issues" | "solution" | "clinical" | "general" | "finished" | "">("");
  const [studentInput, setStudentInput] = useState("");

  // Grading states
  const [issuesAnswer, setIssuesAnswer] = useState("");
  const [issuesResult, setIssuesResult] = useState<{ score: number; feedback: string; suggestedModelAnswer: string } | null>(null);

  const [solutionAnswer, setSolutionAnswer] = useState("");
  const [solutionResult, setSolutionResult] = useState<{ score: number; feedback: string; suggestedModelAnswer: string } | null>(null);

  const [clinicalAnswer, setClinicalAnswer] = useState("");
  const [clinicalResult, setClinicalResult] = useState<{ score: number; feedback: string; suggestedModelAnswer: string } | null>(null);

  const [generalAnswer, setGeneralAnswer] = useState("");
  const [generalResult, setGeneralResult] = useState<{ score: number; feedback: string; suggestedModelAnswer: string } | null>(null);

  // Viewing historical attempt state
  const [viewingAttempt, setViewingAttempt] = useState<PastQuestion | null>(null);

  const historyCount = history.length;
  const visibleSourceNames = useMemo(
    () => Array.from(new Set(sourceNames.map((source) => source.trim()).filter(Boolean))).slice(0, 8),
    [sourceNames],
  );
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [history]);

  // Step labels
  const stepLabel = useMemo(() => {
    if (activeStep === "issues") return "Step 1: Identify Key Legal Issues";
    if (activeStep === "solution") return "Step 2: Propose the Legal Rules Application & Solution";
    if (activeStep === "clinical") return "Consultation: Diagnosing and Managing the Patient Case";
    if (activeStep === "general") return "Challenge: Formulate and Input Your Solution";
    return "";
  }, [activeStep]);

  const stepPlaceholder = useMemo(() => {
    if (activeStep === "issues") return "Spotted legal issues... (e.g. breach of contract, neighbour principle under Donoghue v Stevenson...)";
    if (activeStep === "solution") return "Legal solution... (apply rules to details, cite cases, state concluding liability...)";
    if (activeStep === "clinical") return "Doctor's analysis... (state diagnostic queries, symptoms checks, clinical diagnosis, and management path...)";
    return "Technical/design analysis... (how you will solve the brief, equations applied, or architectural diagram overview...)";
  }, [activeStep]);

  const handleGenerateScenario = async () => {
    setScenarioState("generating");
    setViewingAttempt(null);
    try {
      const response = await fetch("/api/agents/scenario/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, educationLevel, topic: topicInput.trim() }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        topic?: string;
        scenario?: string;
        error?: string;
      };

      if (!response.ok || !data.success || !data.scenario) {
        throw new Error(data.error ?? "Failed to generate scenario.");
      }

      setScenarioData({
        topic: data.topic ?? (topicInput.trim() || "General Study Case"),
        scenario: data.scenario,
      });

      // Clear previous inputs
      setIssuesAnswer("");
      setIssuesResult(null);
      setSolutionAnswer("");
      setSolutionResult(null);
      setClinicalAnswer("");
      setClinicalResult(null);
      setGeneralAnswer("");
      setGeneralResult(null);

      // Transition state
      setScenarioState("active");
      if (subjectType === "law") {
        setActiveStep("issues");
      } else if (subjectType === "medicine") {
        setActiveStep("clinical");
      } else {
        setActiveStep("general");
      }
      setStudentInput("");
      setTopicInput("");
      toast.success("New scenario generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate scenario.");
      setScenarioState("idle");
    }
  };

  const saveAttemptToDb = async (attempt: { topic: string; scenario: string; score: number; detail: string }) => {
    try {
      const confidence: ConfidenceLevel = attempt.score >= 80 ? "high" : attempt.score >= 50 ? "medium" : "low";
      const response = await fetch("/api/agents/past-question/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          question: `[Scenario Simulator] ${attempt.topic}`,
          answer: attempt.detail,
          confidence,
        }),
      });

      const resData = (await response.json()) as { success?: boolean; material?: PastQuestion };

      if (response.ok && resData.material) {
        setHistory((current) => [resData.material!, ...current]);
        
        // Award XP
        const awarded = await awardStudyXp(30);
        setStoryXp((current) => awarded?.xp ?? current + 30);
        toast.success("+30 XP Awarded!");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to save attempt to history:", err);
    }
  };

  const handleGradeStep = async () => {
    if (!studentInput.trim() || !scenarioData) return;

    setScenarioState("grading");
    try {
      const response = await fetch("/api/agents/scenario/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          subjectType,
          scenario: scenarioData.scenario,
          topic: scenarioData.topic,
          step: activeStep,
          studentInput: studentInput.trim(),
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        score?: number;
        feedback?: string;
        suggestedModelAnswer?: string;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to grade step.");
      }

      const result = {
        score: data.score ?? 70,
        feedback: data.feedback ?? "Well done.",
        suggestedModelAnswer: data.suggestedModelAnswer ?? "No template answer.",
      };

      if (activeStep === "issues") {
        setIssuesAnswer(studentInput);
        setIssuesResult(result);
        setActiveStep("solution");
        setStudentInput("");
        setScenarioState("active");
        toast.success(`Step 1 Graded: ${result.score}/100`);
      } else if (activeStep === "solution") {
        setSolutionAnswer(studentInput);
        setSolutionResult(result);
        setScenarioState("finished");
        setActiveStep("finished");
        toast.success(`Step 2 Graded: ${result.score}/100`);

        // Compute average score
        const finalScore = Math.round(((issuesResult?.score ?? 70) + result.score) / 2);
        const detailMarkdown = `### Scenario / Case facts:\n${scenarioData.scenario}\n\n#### 1. Spotted Legal Issues (Grade: ${issuesResult?.score ?? 70}/100)\n*Student Answer:*\n${issuesAnswer}\n\n*Evaluation Feedback:*\n${issuesResult?.feedback}\n\n*Model Suggested Answer:*\n${issuesResult?.suggestedModelAnswer}\n\n#### 2. Legal Rules & Solution (Grade: ${result.score}/100)\n*Student Answer:*\n${studentInput}\n\n*Evaluation Feedback:*\n${result.feedback}\n\n*Model Suggested Answer:*\n${result.suggestedModelAnswer}`;

        await saveAttemptToDb({
          topic: scenarioData.topic,
          scenario: scenarioData.scenario,
          score: finalScore,
          detail: detailMarkdown,
        });
      } else if (activeStep === "clinical") {
        setClinicalAnswer(studentInput);
        setClinicalResult(result);
        setScenarioState("finished");
        setActiveStep("finished");
        toast.success(`Consultation Graded: ${result.score}/100`);

        const detailMarkdown = `### Clinical Patient Scenario:\n${scenarioData.scenario}\n\n#### Diagnostic Reasoning (Grade: ${result.score}/100)\n*Student Answer:*\n${studentInput}\n\n*Evaluation Feedback:*\n${result.feedback}\n\n*Model Suggested Diagnosis & Care:*\n${result.suggestedModelAnswer}`;

        await saveAttemptToDb({
          topic: scenarioData.topic,
          scenario: scenarioData.scenario,
          score: result.score,
          detail: detailMarkdown,
        });
      } else {
        setGeneralAnswer(studentInput);
        setGeneralResult(result);
        setScenarioState("finished");
        setActiveStep("finished");
        toast.success(`Graded: ${result.score}/100`);

        const detailMarkdown = `### Study Scenario Case:\n${scenarioData.scenario}\n\n#### Design Solution (Grade: ${result.score}/100)\n*Student Answer:*\n${studentInput}\n\n*Evaluation Feedback:*\n${result.feedback}\n\n*Model Suggested Answer:*\n${result.suggestedModelAnswer}`;

        await saveAttemptToDb({
          topic: scenarioData.topic,
          scenario: scenarioData.scenario,
          score: result.score,
          detail: detailMarkdown,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to grade step.");
      setScenarioState("active");
    }
  };

  const handleDownloadPdf = () => {
    if (!scenarioData) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const maxWidth = pageWidth - margin * 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(109, 40, 217); // Purple
    doc.text("StudyMate Exam Practice Session", margin, 24);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    doc.text(`Course: ${courseName}`, margin, 34);
    doc.text(`Topic: ${scenarioData.topic}`, margin, 40);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 46);

    let cursorY = 56;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text("Practice Scenario Facts / Details", margin, cursorY);
    cursorY += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    const scenarioLines = doc.splitTextToSize(scenarioData.scenario.replace(/[#*_`]/g, ""), maxWidth);
    for (const line of scenarioLines) {
      if (cursorY > pageHeight - 20) {
        doc.addPage();
        cursorY = 20;
      }
      doc.text(line, margin, cursorY);
      cursorY += 6;
    }
    cursorY += 6;

    const renderStepResult = (stepTitle: string, input: string, feedback: string, modelAnswer: string, score: number) => {
      if (cursorY > pageHeight - 50) {
        doc.addPage();
        cursorY = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(109, 40, 217);
      doc.text(`${stepTitle} (Score: ${score}/100)`, margin, cursorY);
      cursorY += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(17, 24, 39);
      doc.text("Your Response:", margin, cursorY);
      cursorY += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(55, 65, 81);
      const inputLines = doc.splitTextToSize(input, maxWidth);
      for (const line of inputLines) {
        if (cursorY > pageHeight - 20) {
          doc.addPage();
          cursorY = 20;
        }
        doc.text(line, margin, cursorY);
        cursorY += 5.5;
      }
      cursorY += 4;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text("Evaluator Feedback:", margin, cursorY);
      cursorY += 6;

      doc.setFont("helvetica", "normal");
      const feedbackLines = doc.splitTextToSize(feedback.replace(/[#*_`]/g, ""), maxWidth);
      for (const line of feedbackLines) {
        if (cursorY > pageHeight - 20) {
          doc.addPage();
          cursorY = 20;
        }
        doc.text(line, margin, cursorY);
        cursorY += 5.5;
      }
      cursorY += 4;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(109, 40, 217);
      doc.text("Exam-Ready Model Answer:", margin, cursorY);
      cursorY += 6;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(31, 41, 55);
      const modelLines = doc.splitTextToSize(modelAnswer.replace(/[#*_`]/g, ""), maxWidth);
      for (const line of modelLines) {
        if (cursorY > pageHeight - 20) {
          doc.addPage();
          cursorY = 20;
        }
        doc.text(line, margin, cursorY);
        cursorY += 5.5;
      }
      cursorY += 8;
    };

    if (subjectType === "law") {
      if (issuesResult) renderStepResult("Step 1: Identifying Issues", issuesAnswer, issuesResult.feedback, issuesResult.suggestedModelAnswer, issuesResult.score);
      if (solutionResult) renderStepResult("Step 2: Legal Application & Solution", solutionAnswer, solutionResult.feedback, solutionResult.suggestedModelAnswer, solutionResult.score);
    } else if (subjectType === "medicine") {
      if (clinicalResult) renderStepResult("Clinical Evaluation & Interaction", clinicalAnswer, clinicalResult.feedback, clinicalResult.suggestedModelAnswer, clinicalResult.score);
    } else {
      if (generalResult) renderStepResult("Problem Analysis & Design", generalAnswer, generalResult.feedback, generalResult.suggestedModelAnswer, generalResult.score);
    }

    const pageCount = doc.getNumberOfPages();
    for (let index = 1; index <= pageCount; index += 1) {
      doc.setPage(index);
      doc.setFontSize(8.5);
      doc.setTextColor(156, 163, 175);
      doc.text(`Page ${index} of ${pageCount}`, pageWidth - margin - 22, pageHeight - 8);
    }

    doc.save(`${courseName.toLowerCase().replace(/\s+/g, "-")}-exam-ready-answer.pdf`);
    toast.success("PDF Downloaded!");
  };

  const handleReset = () => {
    setScenarioState("idle");
    setScenarioData(null);
    setActiveStep("");
    setStudentInput("");
    setViewingAttempt(null);
  };

  const handleLoadAttempt = (entry: PastQuestion) => {
    setViewingAttempt(entry);
    setScenarioState("idle");
    setScenarioData(null);
  };

  const handleDeleteAttempt = async (entryId: string) => {
    try {
      const response = await fetch("/api/agents/past-question", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, questionId: entryId }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete history item.");
      }

      setHistory((current) => current.filter((item) => item.id !== entryId));
      if (viewingAttempt && viewingAttempt.id === entryId) {
        setViewingAttempt(null);
      }
      toast.success("History item deleted.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete history item.");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-400">Scenario Simulator</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950">{courseName}</h1>
          <p className="max-w-2xl text-sm leading-6 text-gray-600">
            Interact with scenario-based exams. Spot issues, apply rules, act as a clinician, and generate downloadable exam-ready PDF answers.
          </p>
          <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${subjectMeta.badge}`}>
            {subjectMeta.label}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Total Practice Sessions</p>
            <p className="mt-1 text-2xl font-bold text-gray-950">{historyCount}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Practice Score</p>
            <p className="mt-1 text-sm font-bold text-violet-700">
              {scenarioState === "grading" ? "Grading..." : activeStep === "finished" ? "Session Complete" : "Active Flow"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left Column: Simulator Workspace or Historical Viewer */}
        <div className="space-y-6">
          {viewingAttempt ? (
            <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <button
                  onClick={() => setViewingAttempt(null)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Simulator
                </button>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getConfidenceMeta(viewingAttempt.confidence ?? "medium").badge}`}>
                  {getConfidenceMeta(viewingAttempt.confidence ?? "medium").label}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-950">{viewingAttempt.question}</h2>
              <p className="text-xs text-gray-400">Attempted on {formatDate(viewingAttempt.created_at)}</p>

              <div className="prose prose-slate max-w-none rounded-xl bg-gray-50 p-5 mt-4">
                <ReactMarkdown>{viewingAttempt.answer}</ReactMarkdown>
              </div>
            </article>
          ) : scenarioState === "idle" ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center py-16 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-950">Start Scenario Practice</h2>
              <p className="mx-auto max-w-md text-sm text-gray-600">
                Input a specific topic to study, or leave it blank to automatically generate a scenario based on your uploaded course documents.
              </p>

              <div className="mx-auto max-w-md space-y-3 pt-2">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="E.g. Negligence Duty of Care, Contract Acceptance, Diagnostics..."
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-gray-50"
                />
                <button
                  onClick={handleGenerateScenario}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Exam Scenario
                </button>
              </div>
            </div>
          ) : scenarioState === "generating" ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center py-20 space-y-4">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-violet-700" />
              <h3 className="text-xl font-bold text-gray-900">Assembling Practice Scenario</h3>
              <p className="text-sm text-gray-500">Reviewing your course material and drafting an exam-style scenario...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Scenario Facts Box */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                  <h3 className="text-base font-bold text-purple-800">
                    Topic: {scenarioData?.topic}
                  </h3>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-rose-600"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reset Simulator
                  </button>
                </div>
                <div className="prose prose-slate max-w-none text-sm text-gray-700 leading-relaxed pt-1">
                  <ReactMarkdown>{scenarioData?.scenario ?? ""}</ReactMarkdown>
                </div>
                <SourcesUsedPanel sources={visibleSourceNames} knowledgeLayer="course_material" compact />
              </div>

              {/* Step Output/Workroom */}
              {activeStep !== "finished" && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-violet-700" />
                    {stepLabel}
                  </h3>

                  {scenarioState === "grading" ? (
                    <div className="text-center py-8 space-y-3">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-700" />
                      <p className="text-sm font-semibold text-gray-500">Grading response against material guidelines...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeStep === "solution" && issuesResult && (
                        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 space-y-2">
                          <p className="text-sm font-bold text-violet-950 flex items-center gap-2">
                            Step 1 Grade: <span className="text-violet-700">{issuesResult.score}/100</span>
                          </p>
                          <div className="text-xs text-violet-900/90 leading-relaxed max-h-[140px] overflow-y-auto">
                            <ReactMarkdown>{issuesResult.feedback}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900">Your Response:</label>
                        <textarea
                          value={studentInput}
                          onChange={(e) => setStudentInput(e.target.value)}
                          placeholder={stepPlaceholder}
                          className="min-h-[180px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm leading-7 text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-gray-50 transition"
                        />
                      </div>

                      <button
                        onClick={handleGradeStep}
                        disabled={!studentInput.trim()}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4" />
                        Submit Answer for Evaluation
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Finished / Summary Grading Screen */}
              {activeStep === "finished" && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
                  <div className="text-center space-y-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Trophy className="h-7 w-7" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-950">Practice Attempt Evaluated!</h2>
                    <p className="text-sm text-gray-500">Your interactive scenario grades and feedback are summarized below.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {subjectType === "law" ? (
                      <>
                        <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4 text-center">
                          <p className="text-xs uppercase tracking-wider text-violet-600 font-semibold">Step 1 (Issues)</p>
                          <p className="mt-1 text-3xl font-black text-violet-950">{issuesResult?.score ?? 0}%</p>
                        </div>
                        <div className="rounded-xl border border-fuchsia-100 bg-fuchsia-50/50 p-4 text-center">
                          <p className="text-xs uppercase tracking-wider text-fuchsia-600 font-semibold">Step 2 (Solution)</p>
                          <p className="mt-1 text-3xl font-black text-fuchsia-950">{solutionResult?.score ?? 0}%</p>
                        </div>
                      </>
                    ) : subjectType === "medicine" ? (
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-center sm:col-span-2">
                        <p className="text-xs uppercase tracking-wider text-emerald-600 font-semibold">Diagnostic Score</p>
                        <p className="mt-1 text-3xl font-black text-emerald-950">{clinicalResult?.score ?? 0}%</p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-center sm:col-span-2">
                        <p className="text-xs uppercase tracking-wider text-blue-600 font-semibold">Overall Grade</p>
                        <p className="mt-1 text-3xl font-black text-blue-950">{generalResult?.score ?? 0}%</p>
                      </div>
                    )}
                  </div>

                  {/* Feedback Details */}
                  <div className="space-y-4 border-t border-gray-100 pt-5">
                    <h3 className="text-base font-bold text-gray-900">Grading Critique & Feedbacks</h3>
                    
                    {subjectType === "law" ? (
                      <div className="space-y-3 text-sm text-gray-700">
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="font-bold text-gray-900 mb-1">Issues Spotting:</p>
                          <ReactMarkdown>{issuesResult?.feedback ?? ""}</ReactMarkdown>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="font-bold text-gray-900 mb-1">Rules Application:</p>
                          <ReactMarkdown>{solutionResult?.feedback ?? ""}</ReactMarkdown>
                        </div>
                      </div>
                    ) : subjectType === "medicine" ? (
                      <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700">
                        <ReactMarkdown>{clinicalResult?.feedback ?? ""}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700">
                        <ReactMarkdown>{generalResult?.feedback ?? ""}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* PDF Download and Try Again controls */}
                  <div className="flex flex-col gap-3 sm:flex-row pt-4">
                    <button
                      onClick={handleDownloadPdf}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
                    >
                      <Download className="h-4 w-4" />
                      Download Exam-Ready PDF Answer
                    </button>
                    <button
                      onClick={handleReset}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-violet-200"
                    >
                      Practice Another Scenario
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar Column: Practice History */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-violet-100 bg-violet-50 p-6 shadow-sm">
            <Trophy className="h-8 w-8 text-violet-700" />
            <h2 className="mt-4 text-lg font-semibold text-gray-950">Study Rewards</h2>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              Completed attempts earn +30 XP and generate customized exam-ready PDFs.
            </p>
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wider">
                <span>XP Balance</span>
                <span className="font-bold text-gray-900">{storyXp} XP</span>
              </div>
              <div className="h-2 rounded-full bg-violet-200 overflow-hidden">
                <div className="h-full bg-violet-600 rounded-full" style={{ width: `${Math.min(100, (storyXp % 100))}%` }} />
              </div>
            </div>
          </section>

          <SourcesUsedPanel sources={visibleSourceNames} knowledgeLayer="course_material" compact />

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900">Practice History</h3>
            <p className="text-xs text-gray-500 mt-1">Review your past simulator attempts.</p>

            {sortedHistory.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-6 text-center text-xs text-gray-500">
                No sessions completed yet.
              </div>
            ) : (
              <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {sortedHistory.map((entry) => {
                  const isViewing = viewingAttempt?.id === entry.id;
                  const badge = getConfidenceMeta(entry.confidence ?? "medium");
                  return (
                    <article
                      key={entry.id}
                      className={`flex flex-col gap-2 rounded-xl border p-3.5 transition text-left ${
                        isViewing ? "border-violet-500 bg-violet-50/20" : "border-gray-100 bg-gray-50 hover:bg-gray-100/70"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleLoadAttempt(entry)}
                        className="text-left"
                      >
                        <p className="line-clamp-2 text-xs font-bold text-gray-900 leading-relaxed">
                          {entry.question.replace("[Scenario Simulator] ", "")}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-500">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ${badge.badge}`}>
                            {badge.label}
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold">
                            <CalendarDays className="h-3 w-3" />
                            {formatDate(entry.created_at)}
                          </span>
                        </div>
                      </button>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => void handleDeleteAttempt(entry.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
