import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const packsApi = createApi({
  reducerPath: 'packsApi',
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
  tagTypes: ['Packs'],
  endpoints: (builder) => ({
    getPacks: builder.query({
      query: () => '/packs',
      providesTags: ['Packs'],
    }),
    getPackDetail: builder.query({
      query: (packId) => `/packs/${packId}`,
      providesTags: (_result, _error, arg) => [{ type: 'Packs', id: arg }],
    }),
    startPackSession: builder.mutation({
      query: (packId) => ({
        url: `/packs/${packId}/start`,
        method: 'POST',
      }),
      invalidatesTags: ['Packs'],
    }),
    purchasePack: builder.mutation({
      query: (packId) => ({
        url: `/packs/${packId}/purchase`,
        method: 'POST',
      }),
      invalidatesTags: ['Packs'],
    }),
  }),
});

export const {
  useGetPacksQuery,
  useGetPackDetailQuery,
  useStartPackSessionMutation,
  usePurchasePackMutation,
} = packsApi;
export default packsApi;
