import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { api, configured, getPackage, purchase, restore, shareRevisionPdf, supabase } from './lib';
import { adsEnabled, maybeShowPracticeAd, showAdPrivacyOptions } from './ads';

type Course = { id: string; name: string; subject_type: string };
type Question = { id: string; type: 'mcq' | 'essay'; question: string; topic?: string; source_material?: string | null; model_answer?: string; correct_answer?: string; options?: Array<{ text: string; correct?: boolean }>; key_points?: string[]; marks?: number };
type Quiz = { quizSessionId: string; questions: Question[] };

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState('');
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<'plain' | 'story'>('plain');
  const [explanation, setExplanation] = useState('');
  const [citations, setCitations] = useState<Array<string | { title?: string; quote?: string }>>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState<'library' | 'study' | 'paywall'>('library');
  const [price, setPrice] = useState('');
  const latest = useRef({ userId: session?.user.id, page, quiz });
  const breakVersion = useRef(0);
  latest.current = { userId: session?.user.id, page, quiz };
  useEffect(() => { breakVersion.current++; }, [page, session?.user.id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => { if (session) void loadCourses(); else { setCourses([]); setCourse(null); } }, [session?.user.id]);

  async function run(action: () => Promise<void>) {
    breakVersion.current++;
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  }
  async function loadCourses() {
    const { data, error } = await supabase.from('courses').select('id,name,subject_type').order('created_at', { ascending: false });
    if (error) { setMessage(error.message); return; }
    setCourses(data || []);
  }
  function openCourse(selected: Course) {
    setCourse(selected); setPage('study'); setExplanation(''); setQuiz(null); setAnswer(''); setTopic(''); setCitations([]);
  }
  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  }
  async function createCourse() {
    const name = newCourse.trim();
    if (!name) throw new Error('Enter a course name.');
    const result = await api<{ id: string }>('/api/courses/create', { name, subjectType: 'law' });
    setNewCourse(''); await loadCourses();
    openCourse({ id: result.id, name, subject_type: 'law' });
  }
  async function upload(file: File | undefined) {
    if (!file || !course) return;
    if (file.size > 10 * 1024 * 1024) throw new Error('Use a file smaller than 10 MB.');
    if (!['application/pdf', 'text/plain'].includes(file.type)) throw new Error('Choose a text PDF or .txt file.');
    const form = new FormData(); form.set('file', file); form.set('courseId', course.id);
    await api('/api/upload', form);
    setMessage('Upload accepted. Processing may take a few minutes. Then select Prepare learning.');
  }
  async function prepareLearning() {
    if (!course) return;
    const result = await api<{ pagesCreated: number }>('/api/agents/wiki', { courseId: course.id });
    if (!result.pagesCreated) throw new Error('Learning could not be prepared. Please retry.');
    setMessage('Your material is ready. Enter a topic and select Explain this topic.');
  }
  async function learn() {
    if (!course || !topic.trim()) throw new Error('Enter a topic from your uploaded material.');
    const result = await api<{ explanation: string; citations?: Array<string | { title?: string; quote?: string }> }>('/api/agents/explainer', { courseId: course.id, topic: topic.trim(), mode });
    setExplanation(result.explanation); setCitations(result.citations || []); setQuiz(null);
  }
  async function practice(count: number) {
    if (!course) return;
    const result = await api<Quiz>('/api/agents/quiz', { courseId: course.id, quizType: 'mixed', questionCount: count });
    if (!result.questions.length) throw new Error('No questions were generated.');
    setQuiz(result); setQuestionIndex(0); setAnswer(''); setRevealed(false);
  }
  function nextQuestion() {
    if (!quiz) return;
    if (questionIndex < quiz.questions.length - 1) { setQuestionIndex(questionIndex + 1); setAnswer(''); setRevealed(false); }
    else {
      setQuiz(null); latest.current.quiz = null;
      setMessage('Practice set finished. Review your notes and try again.');
      if (session) {
        const userId = session.user.id;
        const breakId = ++breakVersion.current;
        void maybeShowPracticeAd(userId, () => breakVersion.current === breakId && latest.current.userId === userId && latest.current.page === 'study' && latest.current.quiz === null);
      }
    }
  }
  async function showPaywall() {
    setPage('paywall'); setPrice('');
    if (!session) return;
    try { const selected = await getPackage(session.user.id); setPrice(selected.product.priceString); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Billing unavailable.'); }
  }

  if (!configured) return <main className="shell"><header><strong>StudyMate</strong></header><section className="card"><h1>Setup needed</h1><p>Copy <code>mobile/.env.example</code> to <code>mobile/.env</code> and add the public Supabase keys and backend URL. The backend and RevenueCat services have not been connected yet.</p></section></main>;
  return <main className="shell">
    <header><strong>StudyMate<span className="mark">●</span></strong><span className="eyebrow">Your material. Your momentum.</span></header>
    {message && <div className="notice" role="status">{message}<button aria-label="Dismiss message" onClick={() => setMessage('')}>×</button></div>}
    {!session ? <section className="card auth"><span className="step">START HERE</span><h1>Study for the questions that count.</h1><p>Sign in with your existing StudyMate account to use your courses and material.</p><label>Email<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label><button disabled={busy} onClick={() => void run(signIn)}>Sign in</button></section> : <>
      <nav><button className={page === 'library' ? 'active' : ''} onClick={() => setPage('library')}>Courses</button><button className={page === 'study' ? 'active' : ''} disabled={!course} onClick={() => setPage('study')}>Study</button><button className={page === 'paywall' ? 'active' : ''} onClick={() => void showPaywall()}>Pro</button><button onClick={() => void supabase.auth.signOut()}>Sign out</button>{adsEnabled && <button onClick={() => void run(showAdPrivacyOptions)}>Ad privacy</button>}</nav>
      {page === 'library' && <><div className="hero"><span className="step">01 / CHOOSE</span><h1>One course at a time.</h1><p>Pick up where you left off, or start with your own notes.</p></div><section className="card"><h2>Your courses</h2>{courses.length ? courses.map(item => <button key={item.id} className="course" onClick={() => openCourse(item)}><span>{item.name}</span><span>Continue →</span></button>) : <p>No courses yet.</p>}</section><section className="card"><h2>New course</h2><label>Course name<input value={newCourse} onChange={e => setNewCourse(e.target.value)} placeholder="e.g. Law of Torts" /></label><button disabled={busy} onClick={() => void run(createCourse)}>Create course</button><p className="hint">This first build uses the law subject profile for new courses.</p></section></>}
      {page === 'study' && course && <><div className="hero"><span className="step">02 / STUDY</span><h1>{course.name}</h1><p>Upload material, learn a topic, then practise.</p></div><section className="card"><span className="step">MATERIAL</span><h2>Add your notes</h2><p>Text based PDFs and .txt files are supported by the existing backend. After processing, prepare your material for learning.</p><label className="file">Choose PDF or text file<input type="file" accept=".pdf,.txt,application/pdf,text/plain" disabled={busy} onChange={e => void run(() => upload(e.target.files?.[0]))} /></label><button disabled={busy} onClick={() => void run(prepareLearning)}>Prepare learning</button></section><section className="card"><span className="step">LEARN</span><h2>Make it make sense</h2><label>Topic<input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Duty of care" /></label><div className="segmented"><button className={mode === 'plain' ? 'active' : ''} onClick={() => setMode('plain')}>Plain</button><button className={mode === 'story' ? 'active' : ''} onClick={() => setMode('story')}>Story</button></div><button disabled={busy} onClick={() => void run(learn)}>{busy ? 'Working…' : 'Explain this topic'}</button>{explanation && <article className="answer"><span className="step">GENERATED FROM COURSE CONTEXT</span><pre>{explanation}</pre>{citations.length > 0 && <details><summary>Sources used</summary>{citations.map((citation, i) => <p key={i}>{typeof citation === 'string' ? citation : citation.title || citation.quote || 'Source reference'}</p>)}</details>}</article>}</section><section className="card"><span className="step">PRACTISE</span><h2>Try an exam question</h2><p>Answer before revealing the reference answer. The current quiz backend also sends answers to the client, so this is a self-check, not secure grading.</p><div className="actions"><button disabled={busy} onClick={() => void run(() => practice(3))}>3 questions · Free</button><button className="secondary" disabled={busy} onClick={() => void run(() => practice(5))}>5 questions · Pro</button></div>{quiz && <div className="question"><span className="step">QUESTION {questionIndex + 1} OF {quiz.questions.length}</span><h3>{quiz.questions[questionIndex].question}</h3>{quiz.questions[questionIndex].source_material && <p className="hint">Source: {quiz.questions[questionIndex].source_material}</p>}<label>Your answer<textarea value={answer} disabled={revealed} onChange={e => setAnswer(e.target.value)} rows={5} /></label>{!revealed ? <button disabled={!answer.trim()} onClick={() => setRevealed(true)}>Submit answer</button> : <><div className="feedback"><strong>Reference answer</strong><p>{quiz.questions[questionIndex].model_answer || quiz.questions[questionIndex].correct_answer || 'Review your course notes.'}</p></div><button onClick={nextQuestion}>{questionIndex < quiz.questions.length - 1 ? 'Next question' : 'Finish set'}</button></>}</div>}</section><section className="card"><span className="step">REVISION</span><h2>Take your course report</h2><p>This PDF contains the course data and attempts already stored on the backend. Answers from the self-check above are not saved yet.</p><button disabled={busy} onClick={() => void run(() => shareRevisionPdf(course.id))}>Download or share PDF</button></section></>}
      {page === 'paywall' && <><div className="hero"><span className="step">STUDYMATE PRO</span><h1>Go further with each topic.</h1><p>Unlock five question practice sets with RevenueCat.</p></div><section className="card"><h2>{price ? `${price} · see billing period in store` : 'Subscription'}</h2><p>The exact localized price and terms are shown by the store before you confirm.</p><button disabled={busy || !price} onClick={() => void run(async () => { if (await purchase(session.user.id)) setMessage('StudyMate Pro is active.'); else setMessage('Purchase completed without an active Pro entitlement.'); })}>Subscribe</button><button className="secondary" disabled={busy} onClick={() => void run(async () => { setMessage(await restore(session.user.id) ? 'StudyMate Pro restored.' : 'No active Pro subscription was found.'); })}>Restore purchases</button><p className="hint">Purchases require a configured Android build. The server verifies Pro before generating the longer set.</p></section></>}
    </>}
  </main>;
}
