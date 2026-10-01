export type SubjectType =
  | "law"
  | "engineering"
  | "medicine"
  | "economics"
  | "other";

export type EducationLevel = "primary" | "secondary" | "tertiary";

export type WikiPageType =
  | "principle"
  | "case"
  | "formula"
  | "maxim"
  | "definition"
  | "concept";

export interface Course {
  id: string;
  user_id: string;
  name: string;
  subject_type: SubjectType;
  description?: string;
  readiness_score?: number | null;
  created_at: string;
}

export interface Material {
  id: string;
  course_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  storage_path?: string;
  mime_type?: string;
  ocr_status?: OcrStatus;
  ocr_progress?: number;
  ocr_text?: string;
  error_message?: string | null;
  indexed: boolean;
  created_at: string;
}

export type OcrStatus = "queued" | "pending" | "processing" | "complete" | "failed";

export interface Note {
  id: string;
  course_id: string;
  content: string;
  generated_at: string;
  edited_at?: string;
}

export interface CourseNote extends Note {
  course_name?: string;
  subject_type?: SubjectType;
}

export interface KeyPoint {
  id: string;
  course_id: string;
  type: "principle" | "case" | "formula" | "maxim" | "definition" | "concept";
  title: string;
  content: string;
  source_material?: string;
  created_at?: string;
}

export type FlashcardStatus = "review" | "mastered";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface Flashcard {
  id: string;
  course_id: string;
  key_point_id: string;
  front: string;
  back: string;
  status: FlashcardStatus;
  key_point_type?: KeyPoint["type"];
  created_at?: string;
}

export interface PastQuestion {
  id: string;
  course_id: string;
  question: string;
  answer?: string;
  confidence?: ConfidenceLevel;
  warning_message?: string | null;
  source_pages?: string[];
  created_at: string;
}

export interface AocAnswer {
  id: string;
  course_id: string;
  topic: string;
  answer: string;
  confidence?: ConfidenceLevel;
  warning_message?: string | null;
  created_at?: string;
}

export interface QuizQuestion {
  id: string;
  course_id: string;
  quiz_session_id?: string;
  type: "mcq" | "essay";
  question: string;
  options?: { label: string; text: string; correct: boolean }[];
  correct_answer?: string;
  explanation?: string;
  model_answer?: string;
  key_points?: string[];
  marks?: number;
  topic?: string;
  source_material?: string;
  created_at?: string;
}

export type QuizType = "mcq" | "essay" | "mixed";

export type QuizGrade = "A" | "B" | "C" | "D" | "F";

export type AnswerMode = "plain" | "story";

export interface QuizAttempt {
  id: string;
  course_id: string;
  quiz_session_id: string;
  quiz_type: QuizType;
  question_count: number;
  score: number;
  max_score: number;
  percentage: number;
  grade: QuizGrade;
  feedback?: string | null;
  strengths?: string[];
  improvements?: string[];
  key_points_covered?: string[];
  key_points_missed?: string[];
  questions_snapshot?: QuizQuestion[];
  answers_snapshot?: Array<Record<string, unknown>>;
  created_at?: string;
}

export interface WikiPage {
  id: string;
  course_id: string;
  title: string;
  type: WikiPageType;
  content: string;
  related_pages: string[];
  source_material?: string | null;
  created_at: string;
}
export type SchoolLicense = { id: string; name: string; status: 'pilot' | 'licensed' | 'suspended'; expires_at: string; seat_limit: number; monthly_pool: number };
export type StudyPlan = { tier: 'free' | 'pro' | 'school'; courseLimit: number; monthlySessions: number; access: 'free' | 'paid' | 'unknown'; school: SchoolLicense | null };
export type StudySession = { id: string; user_id: string; course_id: string; topic: string; plan: 'free' | 'pro' | 'school'; school_id: string | null; assignment_id: string | null; source: 'included' | 'credit' | 'school'; status: 'reserved' | 'active' | 'completed' | 'released'; expires_at: string; request_key: string; period: string };
