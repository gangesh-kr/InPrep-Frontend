import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Analytics', 'LearningPlan', 'Packs'],
  endpoints: (builder) => ({
    getTrends: builder.query({
      query: (params) => ({
        url: '/analytics/trends',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    getScoreBreakdown: builder.query({
      query: () => '/analytics/score-breakdown',
      providesTags: ['Analytics'],
    }),
    getActivity: builder.query({
      query: () => '/analytics/activity',
      providesTags: ['Analytics'],
    }),
    getDashboardFeed: builder.query({
      query: () => '/analytics/dashboard-feed',
      providesTags: ['Analytics', 'LearningPlan', 'Packs'],
    }),
  }),
});

export const {
  useGetTrendsQuery,
  useGetScoreBreakdownQuery,
  useGetActivityQuery,
  useGetDashboardFeedQuery,
} = analyticsApi;
export default analyticsApi;
