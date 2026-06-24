export interface User {
  id: string;
  email: string;
  fullName: string;
  credits: number;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  website?: string;
}

export interface Application {
  id: string;
  userId: string;
  companyId: string;
  company: Company;
  position: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  source?: string;
  status: string;
  appliedDate: string;
  createdAt: string;
  rounds?: InterviewRound[];
}

export interface InterviewRound {
  id: string;
  applicationId: string;
  application?: Application;
  roundNumber: number;
  roundType: string;
  interviewerNames?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  status: string;
  confidenceScore?: number;
  feedbackNotes?: string;
  questions?: Question[];
}

export interface Skill {
  id: string;
  userId: string;
  name: string;
  proficiencyLevel: string;
}

export interface Question {
  id: string;
  roundId?: string;
  round?: InterviewRound;
  text: string;
  answerDraft?: string;
  difficulty: string;
  category: string;
  confidenceLevel: number;
  needsRevision: boolean;
  createdAt: string;
  skills?: Skill[];
}

export interface RevisionItem {
  id: string;
  userId: string;
  questionId: string;
  question: Question;
  scheduledFor: string;
  priority: string;
  status: string;
}

export interface Weakness {
  skillId: string;
  name: string;
  averageConfidence: number;
  questionCount: number;
  needsRevisionCount: number;
  priority: string;
}

export interface LearningItem {
  id: string;
  userId: string;
  skillName: string;
  status: string;
  progressPercent: number;
  hoursInvested: number;
  lastStudiedAt?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  interviewRoundId?: string;
  interviewRound?: InterviewRound;
  wins?: string;
  mistakes?: string;
  mood?: string;
  nextActions?: string;
  loggedAt: string;
}

export interface AnalyticsSummary {
  totalApplications: number;
  responseRate: number;
  interviewRate: number;
  totalOffers: number;
  readinessScore: number;
}

export interface SkillDistribution {
  name: string;
  questionsCount: number;
  averageConfidence: number;
  proficiencyLevel: string;
}

export interface HeatmapItem {
  date: string;
  count: number;
}

export interface AIInterviewTranscriptItem {
  role: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
}

export interface AIQuestionAnalysis {
  question: string;
  candidateAnswer: string;
  rating: number;
  feedback: string;
  idealAnswer: string;
}

export interface AIInterviewEvaluation {
  overallScore: number;
  verdict: 'SELECTED' | 'NOT SELECTED';
  feedbackSummary: string;
  strengths: string[];
  weaknesses: string[];
  questionsAnalysis: AIQuestionAnalysis[];
}

export interface AIInterview {
  id: string;
  userId: string;
  position: string;
  companyName?: string;
  jobDescription: string;
  personality: string;
  overallScore?: number;
  verdict?: 'SELECTED' | 'NOT SELECTED';
  feedbackSummary?: string;
  strengths?: string; // Stored as JSON string
  weaknesses?: string; // Stored as JSON string
  transcript: string; // Stored as JSON string
  createdAt: string;
}

