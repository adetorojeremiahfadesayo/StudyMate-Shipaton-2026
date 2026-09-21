"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import QuizSetup from "./QuizSetup";
import QuizHistory from "./QuizHistory";
import QuizResults from "./QuizResults";
import MCQCard from "./MCQCard";
import EssayQuestion from "./EssayQuestion";
import { awardStudyXp } from "@/lib/study-xp-client";
import type { QuizAttempt, QuizQuestion, QuizType, SubjectType } from "@/types";

type QuizWorkspaceProps = {
  courseId: string;
  courseName: string;
  subjectType: SubjectType;
  initialAttempts: QuizAttempt[];
};

type AnswerRecord = {
  questionId: string;
  type: "mcq" | "essay";
  isCorrect?: boolean;
  score: number;
  maxScore: number;
  selectedAnswer?: string;
  studentAnswer?: string;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  key_points_covered?: string[];
  key_points_missed?: string[];
};

export default function QuizWorkspace({
  courseId,
  courseName,
  subjectType,
  initialAttempts,
}: QuizWorkspaceProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"setup" | "active" | "results" | "review">("setup");
  const [selectedType, setSelectedType] = useState<QuizType | null>(null);
  const [selectedCount, setSelectedCount] = useState<5 | 10 | 15 | 20 | null>(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<AnswerRecord[]>([]);
  const [finalResult, setFinalResult] = useState<{
    score: number;
    maxScore: number;
    percentage: number;
    grade: "A" | "B" | "C" | "D" | "F";
    feedback?: string;
    strengths?: string[];
    improvements?: string[];
    key_points_covered?: string[];
    key_points_missed?: string[];
  } | null>(null);
  const [reviewAttempt, setReviewAttempt] = useState<QuizAttempt | null>(null);
  const [reviewWrongOnly, setReviewWrongOnly] = useState(false);

  const recentAttempts = useMemo(() => {
    return [...initialAttempts].sort(
      (a, b) => new Date(b.created_at ?? "").getTime() - new Date(a.created_at ?? "").getTime(),
    );
  }, [initialAttempts]);

  const correctCount = responses.filter((response) => response.isCorrect).length;

  const currentQuestion = questions[questionIndex] ?? null;

  const saveAttempt = async (payload: {
    score: number;
    maxScore: number;
    percentage: number;
    grade: "A" | "B" | "C" | "D" | "F";
    feedback?: string;
    strengths?: string[];
    improvements?: string[];
    key_points_covered?: string[];
    key_points_missed?: string[];
    responsesSnapshot: AnswerRecord[];
  }) => {
    if (!quizSessionId || !selectedType || !selectedCount) {
      return;
    }

    try {
      const response = await fetch("/api/agents/quiz-grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          attemptSummary: true,
          quizSessionId,
          quizType: selectedType,
          questionCount: selectedCount,
          score: payload.score,
          maxScore: payload.maxScore,
          percentage: payload.percentage,
          grade: payload.grade,
          feedback: payload.feedback,
          strengths: payload.strengths,
          improvements: payload.improvements,
          keyPointsCovered: payload.key_points_covered,
          keyPointsMissed: payload.key_points_missed,
          questionsSnapshot: questions,
          answersSnapshot: payload.responsesSnapshot,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save quiz attempt.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save quiz attempt.";
      toast.error(message);
    }
  };

  const startQuiz = async () => {
    if (!selectedType || !selectedCount || loading) {
      return;
    }

    setLoading(true);
    setReviewAttempt(null);
    setReviewWrongOnly(false);
    try {
      const response = await fetch("/api/agents/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          quizType: selectedType,
          questionCount: selectedCount,
        }),
      });

      const data = (await response.json()) as {
        quizSessionId?: string;
        questions?: QuizQuestion[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not generate quiz. Please try again.");
      }

      setQuizSessionId(data.quizSessionId ?? null);
      setQuestions(data.questions ?? []);
      setQuestionIndex(0);
      setResponses([]);
      setFinalResult(null);
      setMode("active");
      toast.success("Quiz generated.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not generate quiz. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const finishQuestion = async (response: AnswerRecord) => {
    const nextResponses = [...responses, response];
    setResponses(nextResponses);

    const isLastQuestion = questionIndex >= questions.length - 1;

    if (!isLastQuestion) {
      setQuestionIndex((current) => current + 1);
      return;
    }

    const nextScore = nextResponses.reduce((sum, entry) => sum + entry.score, 0);
    const nextMaxScore = nextResponses.reduce((sum, entry) => sum + entry.maxScore, 0);
    const nextPercentage = nextMaxScore > 0 ? Math.round((nextScore / nextMaxScore) * 100) : 0;
    const nextGrade: "A" | "B" | "C" | "D" | "F" =
      nextPercentage >= 80
        ? "A"
        : nextPercentage >= 70
          ? "B"
          : nextPercentage >= 60
            ? "C"
            : nextPercentage >= 50
              ? "D"
              : "F";

    const strengths = nextResponses
      .filter((entry) => entry.isCorrect || entry.score > 0)
      .map((entry) => entry.feedback)
      .filter((value): value is string => Boolean(value));
    const improvements = nextResponses
      .filter((entry) => !entry.isCorrect && entry.score <= 0)
      .map((entry) => entry.feedback)
      .filter((value): value is string => Boolean(value));

    const keyPointsCovered = Array.from(
      new Set(nextResponses.flatMap((entry) => entry.key_points_covered ?? [])),
    );
    const keyPointsMissed = Array.from(
      new Set(nextResponses.flatMap((entry) => entry.key_points_missed ?? [])),
    );

    const resultPayload = {
      score: nextScore,
      maxScore: nextMaxScore,
      percentage: nextPercentage,
      grade: nextGrade,
      feedback: `${nextResponses.filter((entry) => entry.isCorrect).length} questions answered correctly.`,
      strengths,
      improvements,
      key_points_covered: keyPointsCovered,
      key_points_missed: keyPointsMissed,
    };

    setFinalResult(resultPayload);
    setMode("results");
    await saveAttempt({
      ...resultPayload,
      responsesSnapshot: nextResponses,
    });
    if (selectedType) {
      const xpAward = Math.max(20, Math.round(nextPercentage / 4));
      const awarded = await awardStudyXp(xpAward);
      if (!awarded?.error) {
        toast.success(`+${xpAward} XP earned.`, { id: "study-xp" });
      }
    }
  };

  const handleRetakeQuiz = () => {
    setMode("setup");
    setQuestions([]);
    setQuestionIndex(0);
    setResponses([]);
    setFinalResult(null);
    setQuizSessionId(null);
    setSelectedType(null);
    setSelectedCount(null);
    setReviewAttempt(null);
    setReviewWrongOnly(false);
  };

  const handleReviewWrongAnswers = () => {
    setReviewWrongOnly(true);
  };

  const handleSelectAttempt = (attempt: QuizAttempt) => {
    setReviewAttempt(attempt);
    setFinalResult({
      score: attempt.score,
      maxScore: attempt.max_score,
      percentage: attempt.percentage,
      grade: attempt.grade,
      feedback: attempt.feedback ?? undefined,
      strengths: attempt.strengths,
      improvements: attempt.improvements,
      key_points_covered: attempt.key_points_covered,
      key_points_missed: attempt.key_points_missed,
    });
    setQuestions((attempt.questions_snapshot ?? []) as QuizQuestion[]);
    setResponses(
      (attempt.answers_snapshot ?? []) as AnswerRecord[],
    );
    setMode("review");
  };

  if (mode === "setup") {
    return (
      <div className="space-y-6">
        <QuizSetup
          subjectType={subjectType}
          selectedType={selectedType}
          selectedCount={selectedCount}
          onSelectType={setSelectedType}
          onSelectCount={setSelectedCount}
          onStartQuiz={startQuiz}
          canStart={Boolean(selectedType && selectedCount)}
          loading={loading}
          recentAttempts={recentAttempts}
        />
        <QuizHistory attempts={recentAttempts} onSelectAttempt={handleSelectAttempt} />
      </div>
    );
  }

  if (mode === "active" && currentQuestion) {
    return (
      <section className="space-y-6">
        {currentQuestion.type === "mcq" ? (
          <MCQCard
            question={currentQuestion}
            questionNumber={questionIndex + 1}
            totalQuestions={questions.length}
            correctCount={correctCount}
            answeredCount={responses.length}
              onComplete={(result) =>
                void finishQuestion({
                  questionId: result.question.id,
                  type: "mcq",
                  isCorrect: result.isCorrect,
                score: result.score,
                maxScore: result.maxScore,
                selectedAnswer: result.selectedAnswer,
              })
            }
          />
        ) : (
          <EssayQuestion
            courseId={courseId}
            question={currentQuestion}
            questionNumber={questionIndex + 1}
            totalQuestions={questions.length}
            correctCount={correctCount}
            answeredCount={responses.length}
              onComplete={(result) =>
                void finishQuestion({
                  questionId: result.question.id,
                  type: "essay",
                  isCorrect: result.percentage >= 50,
                  score: result.score,
                  maxScore: result.maxScore,
                  studentAnswer: result.studentAnswer,
                  feedback: result.feedback,
                strengths: result.strengths,
                improvements: result.improvements,
                key_points_covered: result.key_points_covered,
                key_points_missed: result.key_points_missed,
              })
            }
          />
        )}
      </section>
    );
  }

  if (mode === "results" && finalResult) {
    return (
      <QuizResults
        quizType={selectedType ?? "mixed"}
        courseName={courseName}
        score={finalResult.score}
        maxScore={finalResult.maxScore}
        percentage={finalResult.percentage}
        grade={finalResult.grade}
        questions={questions}
        answers={responses}
        onRetakeQuiz={handleRetakeQuiz}
        onReviewWrongAnswers={handleReviewWrongAnswers}
        onReturnToCourse={() => router.push(`/courses/${courseId}`)}
        reviewOnly={reviewWrongOnly}
      />
    );
  }

  if (mode === "review" && reviewAttempt && finalResult) {
    return (
      <QuizResults
        quizType={reviewAttempt.quiz_type}
        courseName={courseName}
        score={finalResult.score}
        maxScore={finalResult.maxScore}
        percentage={finalResult.percentage}
        grade={finalResult.grade}
        questions={questions}
        answers={responses}
        onRetakeQuiz={handleRetakeQuiz}
        onReviewWrongAnswers={handleReviewWrongAnswers}
        onReturnToCourse={() => router.push(`/courses/${courseId}`)}
        reviewAttempt={reviewAttempt}
      />
    );
  }

  return null;
}
