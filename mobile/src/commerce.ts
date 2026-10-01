export type Course = { id: string; name: string; subject_type: string; archived_at?: string | null };
export type Usage = { tier: 'free'|'pro'|'school'; remaining: number; used: number; monthlySessions: number; courseLimit: number; activeCourses: number; credits: number; creditDebt: number; poolRemaining: number|null; period: string; ledger: Array<{delta:number;reason:string;created_at:string}> };
export type StudySession = { id:string;course_id:string;topic:string;assignment_id:string|null;source:'included'|'credit'|'school';plan:'free'|'pro'|'school';status:string;expires_at:string };
export type Question = { id:string;type:'mcq'|'essay';question:string;source_material?:string;options?:Array<{label:string;text:string}> };
export type Quiz = {quizSessionId:string;questions:Question[]};
export type Feedback = {percentage:number;feedback:string;attemptId:string;questionCount:number};
export type Assignment = {id:string;title:string;topic:string;target_minutes:number;class_id:string;due_at?:string|null};
export type SchoolDashboard = {
  school:{id:string;name:string;expires_at:string;seat_limit:number;monthly_pool:number;owner_id:string};role:'admin'|'teacher'|'student';
  classes:Array<{id:string;name:string;teacher_id:string}>;
  members:Array<{user_id:string;role:string;display_name:string;active:boolean}>;
  assignments:Assignment[];
  activity:Array<{id:string;assignment_id:string;user_id:string;session_id:string;active_seconds:number;state:string;pause_reason?:string;started_at:string;ended_at?:string;practice:{percentage:number;questionCount:number}|null}>;
};
