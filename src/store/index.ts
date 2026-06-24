import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import authReducer from './authSlice';
import interviewReducer from './slices/interviewSlice';

// Import Services
import historyApi from './services/historyApi';
import analyticsApi from './services/analyticsApi';
import weaknessApi from './services/weaknessApi';
import packsApi from './services/packsApi';
import voiceApi from './services/voiceApi';
import scorecardsApi from './services/scorecardsApi';
import learningPlanApi from './services/learningPlanApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    interview: interviewReducer,
    [historyApi.reducerPath]: historyApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [weaknessApi.reducerPath]: weaknessApi.reducer,
    [packsApi.reducerPath]: packsApi.reducer,
    [voiceApi.reducerPath]: voiceApi.reducer,
    [scorecardsApi.reducerPath]: scorecardsApi.reducer,
    [learningPlanApi.reducerPath]: learningPlanApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(historyApi.middleware)
      .concat(analyticsApi.middleware)
      .concat(weaknessApi.middleware)
      .concat(packsApi.middleware)
      .concat(voiceApi.middleware)
      .concat(scorecardsApi.middleware)
      .concat(learningPlanApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
