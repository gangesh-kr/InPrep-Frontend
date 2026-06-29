import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const learningPlanApi = createApi({
  reducerPath: 'learningPlanApi',
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
  tagTypes: ['LearningPlan'],
  endpoints: (builder) => ({
    getPlan: builder.query({
      query: () => '/learning-plan',
      providesTags: ['LearningPlan'],
    }),
    generatePlan: builder.mutation({
      query: (body) => ({
        url: '/learning-plan/generate',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['LearningPlan'],
    }),
    toggleTask: builder.mutation({
      query: (body) => ({
        url: '/learning-plan/task',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['LearningPlan'],
      async onQueryStarted({ weekNumber, dayOfWeek, taskIndex }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          learningPlanApi.util.updateQueryData('getPlan', undefined, (draft: any) => {
            if (draft && draft.generatedPlan && draft.generatedPlan.weeks) {
              const week = draft.generatedPlan.weeks.find((w: any) => w.weekNumber === weekNumber);
              if (week && week.dailyTasks) {
                const task = week.dailyTasks.find(
                  (t: any, idx: number) => t.day.toLowerCase() === dayOfWeek.toLowerCase() && idx === taskIndex
                );
                if (task) {
                  task.completed = !task.completed;
                }
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    regeneratePlan: builder.mutation({
      query: () => ({
        url: '/learning-plan/regenerate',
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['LearningPlan'],
    }),
    addTask: builder.mutation({
      query: (body) => ({
        url: '/learning-plan/task',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['LearningPlan'],
    }),
    editTask: builder.mutation({
      query: (body) => ({
        url: '/learning-plan/task',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['LearningPlan'],
    }),
    deleteTask: builder.mutation({
      query: (body) => ({
        url: '/learning-plan/task',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: ['LearningPlan'],
    }),
  }),
});

export const {
  useGetPlanQuery,
  useGeneratePlanMutation,
  useToggleTaskMutation,
  useRegeneratePlanMutation,
  useAddTaskMutation,
  useEditTaskMutation,
  useDeleteTaskMutation,
} = learningPlanApi;
export default learningPlanApi;
