"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QuizHistory from "./QuizHistory";
import type { QuizAttempt, QuizQuestion, SubjectType } from "@/types";

type Feedback = { percentage: number; feedback: string; answers?: Array<{ questionId: string; referenceAnswer?: string; feedback: string }> };
export default function QuizWorkspace({ courseId, courseName, initialAttempts }: {
  courseId: string; courseName: string; subjectType: SubjectType; initialAttempts: QuizAttempt[];
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [retry, setRetry] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function run(action: () => Promise<void>) {
    setBusy(true); setMessage('');
    try { await action(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Please retry.'); }
    finally { setBusy(false); }
  }
  async function post(path: string, body: unknown) {
    const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Please retry.');
    return { data, session: response.headers.get('X-Study-Session') };
  }
  async function start(count: number) {
    const { data, session } = await post('/api/agents/quiz', { courseId, quizType: 'mixed', questionCount: count });
    setSessionId(session || data.quizSessionId); setQuestions(data.questions); setAnswers({}); setFeedback(null); setRetry(false);
  }
  async function submit() {
    const { data } = await post('/api/study/submit', { courseId, studySessionId: sessionId, retry, answers: questions.map(q => ({ questionId: q.id, answer: answers[q.id] })) });
    setFeedback(data); router.refresh();
  }
  async function retryWeak() {
    const { data } = await post('/api/study/retry', { courseId, studySessionId: sessionId });
    setQuestions(data.questions); setAnswers({}); setFeedback(null); setRetry(true);
  }
  return <div className="space-y-6">
    <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-xl font-semibold">Practice {courseName}</h2>
      <p>One practice set and one weak-area retry are included in your guided session. Submitted feedback and source references stay in your revision report.</p>
      {message && <p role="status" className="text-red-700">{message}</p>}
      {!questions.length && <div className="flex gap-3"><button disabled={busy} onClick={() => void run(() => start(3))} className="rounded-lg bg-purple-700 text-white p-3">3 questions</button><button disabled={busy} onClick={() => void run(() => start(5))} className="rounded-lg border p-3">5 · Pro, School or top-up</button></div>}
      {questions.map((q, i) => <div key={q.id} className="space-y-3 border-t pt-4">
        <h3 className="font-semibold">{i + 1}. {q.question}</h3>
        {q.source_material && <p className="text-sm text-gray-600">Source: {q.source_material}</p>}
        {q.options?.map(o => <label key={o.label} className="block"><input type="radio" name={q.id} disabled={!!feedback || busy} checked={answers[q.id] === o.label} onChange={() => setAnswers(a => ({ ...a, [q.id]: o.label }))} /> {o.label}. {o.text}</label>)}
        {q.type === 'essay' && <label className="block">Your answer<textarea maxLength={3000} disabled={!!feedback || busy} value={answers[q.id] || ''} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} className="block w-full border rounded-lg p-3" /></label>}
      </div>)}
      {!!questions.length && !feedback && <button disabled={busy || questions.some(q => !answers[q.id]?.trim())} onClick={() => void run(submit)} className="rounded-lg bg-purple-700 text-white p-3">Submit practice set</button>}
      {feedback && <div className="space-y-3"><h3 className="font-semibold">Score: {feedback.percentage}%</h3><p className="whitespace-pre-wrap">{feedback.feedback}</p>{!retry && <button disabled={busy} onClick={() => void run(retryWeak)} className="rounded-lg border p-3">Retry weak areas · included</button>}<button onClick={() => { setQuestions([]); setFeedback(null); }} className="rounded-lg border p-3">Start another session</button></div>}
    </section>
    <QuizHistory attempts={initialAttempts} onSelectAttempt={attempt => { setQuestions((attempt.questions_snapshot || []) as QuizQuestion[]); setFeedback({ percentage: attempt.percentage, feedback: attempt.feedback || 'Saved attempt' }); setRetry(true); setAnswers(Object.fromEntries((attempt.answers_snapshot || []).map(a => { const r = a as Record<string, unknown>; return [r.questionId, r.answer || r.studentAnswer || r.selectedAnswer || '']; }))); }} />
  </div>;
}
