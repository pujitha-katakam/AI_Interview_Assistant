export type Difficulty = 'easy' | 'medium' | 'hard';
export type UserRole = 'interviewer' | 'interviewee';

export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeMeta?: { 
    filename: string; 
    type: 'pdf' | 'docx'; 
    size: number 
  };
  createdAt: string; // ISO
}

export interface QAItem {
  id: string;
  difficulty: Difficulty;
  question: string;
  answer?: string;
  timeAllocatedSec: number;
  startedAt?: string; // ISO
  submittedAt?: string; // ISO
  aiScore?: number;   // 0–10
  aiFeedback?: string;
}

export interface InterviewSession {
  candidateId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  items: QAItem[];
  currentIndex: number;
}

export interface CandidateResult {
  candidateId: string;
  finalScore: number;      // 0–100
  summary: string;         // short AI summary
  finishedAt?: string;     // ISO
}

export interface QuestionResponse {
  id: number;
  difficulty: string;
  question: string;
  timeLimit: number;
}

export interface ScoreResponse {
  score: number;
  feedback: string;
}

export interface ResumeParseResponse {
  name?: string;
  email?: string;
  phone?: string;
  rawText: string;
}

export interface FinalizeResponse {
  finalScore: number;
  summary: string;
}

export interface QuestionRequest {
  role: string;
  counts: Record<string, number>;
  seed?: number;
}

export interface ScoreRequest {
  question: string;
  difficulty: string;
  answer: string;
}

export interface FinalizeRequest {
  items: QAItem[];
  profile: CandidateProfile;
}

export interface UIState {
  modals: {
    welcomeBack: boolean;
    resumeUpload: boolean;
  };
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;
}

export interface ConfigState {
  timerValues: {
    easy: number;
    medium: number;
    hard: number;
  };
  difficultyOrder: Difficulty[];
  scoringWeights: Record<Difficulty, number>;
  backendUrl: string;
}

export interface UserState {
  role: UserRole | null;
  isRoleSelected: boolean;
}
