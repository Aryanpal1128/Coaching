import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { updateAccessToken, logout } from '../slices/authSlice.js';

// VITE_API_URL must be set on Vercel pointing to the Render backend.
// e.g. https://your-backend.onrender.com/api/v1
// Falls back to '/api/v1' for local development (Vite proxy handles it).
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: 'include',          // sends the httpOnly refreshToken cookie automatically
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.accessToken || localStorage.getItem('accessToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  }
});

// Wrapper: on 401 → call /auth/refresh-token → retry original request
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    // Attempt silent token refresh
    const refreshResult = await baseQuery(
      { url: '/auth/refresh-token', method: 'POST' },
      api,
      extraOptions
    );

    const newToken = refreshResult?.data?.data?.accessToken;

    if (newToken) {
      // Silently update the stored access token
      api.dispatch(updateAccessToken(newToken));
      // Retry the original request with the fresh token
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed (refresh token also expired) → force logout
      api.dispatch(logout());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Question', 'Answer', 'Leaderboard', 'LiveClass', 'Notification', 'Admin', 'StudyMaterial', 'Subject', 'Message', 'Follow', 'Room', 'Enrollment'],
  endpoints: () => ({})
});
