import { configureStore, createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, role: null },
  reducers: {
    setCredentials: (s, a) => { s.user = a.payload.user; s.token = a.payload.token; s.role = a.payload.role },
    logout: (s) => { s.user = null; s.token = null; s.role = null }
  }
})

export const { setCredentials, logout } = authSlice.actions

const store = configureStore({
  reducer: { auth: authSlice.reducer }
})

export default store
