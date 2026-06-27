import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const historyApi = createApi({
  reducerPath: 'historyApi',
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
  tagTypes: ['History'],
  endpoints: (builder) => ({
    getHistory: builder.query({
      query: (params) => ({
        url: '/interview-history',
        params,
      }),
      providesTags: ['History'],
    }),
    getHistoryDetails: builder.query({
      query: (sessionId) => `/interview-history/${sessionId}`,
      providesTags: (_result, _error, arg) => [{ type: 'History', id: arg }],
    }),
    deleteHistory: builder.mutation({
      query: (sessionId) => ({
        url: `/interview-history/${sessionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['History'],
    }),
  }),
});

export const {
  useGetHistoryQuery,
  useGetHistoryDetailsQuery,
  useDeleteHistoryMutation,
} = historyApi;
export default historyApi;
