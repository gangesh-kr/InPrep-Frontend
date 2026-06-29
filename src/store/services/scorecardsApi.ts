import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const scorecardsApi = createApi({
  reducerPath: 'scorecardsApi',
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
  tagTypes: ['Scorecard'],
  endpoints: (builder) => ({
    generateScorecard: builder.mutation({
      query: (body) => ({
        url: '/scorecards/generate',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Scorecard'],
    }),
    shareScorecard: builder.mutation({
      query: ({ scorecardId, body }) => ({
        url: `/scorecards/${scorecardId}/share`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Scorecard'],
    }),
    revokeScorecard: builder.mutation({
      query: (scorecardId) => ({
        url: `/scorecards/${scorecardId}/revoke`,
        method: 'POST',
      }),
      invalidatesTags: ['Scorecard'],
    }),
    deleteScorecard: builder.mutation({
      query: (scorecardId) => ({
        url: `/scorecards/${scorecardId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Scorecard'],
    }),
    getPublicScorecard: builder.query({
      query: (publicToken) => `/scorecard/public/${publicToken}`,
      providesTags: (_result, _error, arg) => [{ type: 'Scorecard', id: arg }],
    }),
  }),
});

export const {
  useGenerateScorecardMutation,
  useShareScorecardMutation,
  useRevokeScorecardMutation,
  useDeleteScorecardMutation,
  useGetPublicScorecardQuery,
} = scorecardsApi;
export default scorecardsApi;
