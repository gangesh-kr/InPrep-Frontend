import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const weaknessApi = createApi({
  reducerPath: 'weaknessApi',
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
  tagTypes: ['Weakness'],
  endpoints: (builder) => ({
    getWeaknessProfile: builder.query({
      query: () => '/weakness-profile',
      providesTags: ['Weakness'],
    }),
    refreshWeaknessProfile: builder.mutation({
      query: () => ({
        url: '/weakness-profile/refresh',
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Weakness'],
    }),
  }),
});

export const {
  useGetWeaknessProfileQuery,
  useRefreshWeaknessProfileMutation,
} = weaknessApi;
export default weaknessApi;
