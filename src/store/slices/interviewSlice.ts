import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type InterviewStatus = 
  | 'idle'
  | 'configuring'
  | 'starting'
  | 'questioning'
  | 'submitting'
  | 'evaluating'
  | 'complete'
  | 'error';

export interface InterviewState {
  status: InterviewStatus;
  interviewId: string | null;
  currentQuestion: string | null;
  currentRound: number;
  totalRounds: number;
  evaluation: any | null;
  transcript: any[];
  voiceEnabled: boolean;
  isSimulated: boolean;
  error: string | null;
}

const initialState: InterviewState = {
  status: 'idle',
  interviewId: null,
  currentQuestion: null,
  currentRound: 0,
  totalRounds: 10,
  evaluation: null,
  transcript: [],
  voiceEnabled: false,
  isSimulated: false,
  error: null,
};

export const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startConfiguring: (state) => {
      state.status = 'configuring';
      state.interviewId = null;
      state.currentQuestion = null;
      state.currentRound = 0;
      state.evaluation = null;
      state.transcript = [];
      state.error = null;
    },
    setVoiceEnabled: (state, action: PayloadAction<boolean>) => {
      state.voiceEnabled = action.payload;
    },
    startSession: (state) => {
      state.status = 'starting';
      state.error = null;
    },
    startSessionSuccess: (
      state,
      action: PayloadAction<{ interviewId: string; firstQuestion: string; isSimulated: boolean }>
    ) => {
      state.status = 'questioning';
      state.interviewId = action.payload.interviewId;
      state.currentQuestion = action.payload.firstQuestion;
      state.currentRound = 1;
      state.isSimulated = action.payload.isSimulated;
      state.transcript = [
        {
          role: 'interviewer',
          text: action.payload.firstQuestion,
          timestamp: new Date().toISOString(),
        },
      ];
    },
    startSessionFailure: (state, action: PayloadAction<string>) => {
      state.status = 'error';
      state.error = action.payload;
    },
    submitAnswer: (state) => {
      state.status = 'submitting';
    },
    submitAnswerSuccess: (
      state,
      action: PayloadAction<{
        isFinished: boolean;
        nextQuestion?: string;
        evaluation?: any;
        transcript: any[];
      }>
    ) => {
      state.transcript = action.payload.transcript;
      if (action.payload.isFinished) {
        state.status = 'evaluating';
        state.evaluation = action.payload.evaluation;
        state.status = 'complete';
      } else {
        state.status = 'questioning';
        state.currentQuestion = action.payload.nextQuestion || null;
        state.currentRound += 1;
      }
    },
    submitAnswerFailure: (state, action: PayloadAction<string>) => {
      state.status = 'error';
      state.error = action.payload;
    },
    finishSessionEarly: (state) => {
      state.status = 'submitting';
    },
    finishSessionSuccess: (
      state,
      action: PayloadAction<{ evaluation: any; transcript: any[] }>
    ) => {
      state.status = 'evaluating';
      state.evaluation = action.payload.evaluation;
      state.transcript = action.payload.transcript;
      state.status = 'complete';
    },
    resetInterview: (state) => {
      return {
        ...initialState,
        voiceEnabled: state.voiceEnabled, // Keep voice preference
      };
    },
    setError: (state, action: PayloadAction<string>) => {
      state.status = 'error';
      state.error = action.payload;
    },
  },
});

export const {
  startConfiguring,
  setVoiceEnabled,
  startSession,
  startSessionSuccess,
  startSessionFailure,
  submitAnswer,
  submitAnswerSuccess,
  submitAnswerFailure,
  finishSessionEarly,
  finishSessionSuccess,
  resetInterview,
  setError,
} = interviewSlice.actions;

export default interviewSlice.reducer;
