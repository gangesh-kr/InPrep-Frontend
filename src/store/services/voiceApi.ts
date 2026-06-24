import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const voiceApi = createApi({
  reducerPath: 'voiceApi',
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
  endpoints: (builder) => ({
    transcribe: builder.mutation({
      query: (formData) => ({
        url: '/voice/transcribe',
        method: 'POST',
        body: formData,
      }),
    }),
    synthesize: builder.mutation({
      query: (body) => ({
        url: '/voice/synthesize',
        method: 'POST',
        body,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useTranscribeMutation,
  useSynthesizeMutation,
} = voiceApi;
export default voiceApi;
