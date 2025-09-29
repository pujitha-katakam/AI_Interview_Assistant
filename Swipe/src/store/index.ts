import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import localforage from 'localforage'
import { combineReducers } from '@reduxjs/toolkit'
import sessionReducer from './slices/sessionSlice'
import candidatesReducer from './slices/candidatesSlice'
import uiReducer from './slices/uiSlice'
import configReducer from './slices/configSlice'
import userReducer from './slices/userSlice'

// Configure localforage
localforage.config({
  name: 'InterviewAssistant',
  storeName: 'appData'
})

const persistConfig = {
  key: 'root',
  storage: localforage,
  whitelist: ['session', 'candidates', 'config']
}

const rootReducer = combineReducers({
  session: sessionReducer,
  candidates: candidatesReducer,
  ui: uiReducer,
  config: configReducer,
  user: userReducer
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
})

export const persistor = persistStore(store)

// Define the root state type manually to avoid persist typing issues
export interface RootState {
  session: ReturnType<typeof sessionReducer>;
  candidates: ReturnType<typeof candidatesReducer>;
  ui: ReturnType<typeof uiReducer>;
  config: ReturnType<typeof configReducer>;
  user: ReturnType<typeof userReducer>;
}

export type AppDispatch = typeof store.dispatch
