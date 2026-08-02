import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { updateAccessToken, logout } from '../slices/authSlice.js';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
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
  tagTypes: ['User', 'Question', 'Answer', 'Leaderboard', 'LiveClass', 'Notification', 'Admin', 'StudyMaterial', 'Subject', 'Message'],
  endpoints: () => ({})
});
