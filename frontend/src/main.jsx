import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from './components/ui/sonner.jsx'
import { toast } from 'sonner'
import { Provider } from 'react-redux'
import store from './redux/store.js'
import { setUser } from './redux/authSlice.js'
import { persistStore } from 'redux-persist'
import { PersistGate } from 'redux-persist/integration/react'
import axios from 'axios'

// Setup global axios defaults for cross-origin deployments (Vercel <-> Render)
axios.defaults.withCredentials = true;
axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Setup response interceptor for handling 401 Session Expiration
let isSessionExpiredToastShown = false;

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401 && (data?.sessionExpired || data?.message?.toLowerCase().includes('expire') || data?.message?.toLowerCase().includes('not authenticated'))) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('hirehub_last_activity');
      localStorage.removeItem('token');
      localStorage.removeItem('persist:root');
      store.dispatch(setUser(null));

      if (!isSessionExpiredToastShown) {
        isSessionExpiredToastShown = true;
        toast.error(data?.message || 'Your session has expired. Please log in again to continue.', {
          duration: 4500,
        });

        setTimeout(() => {
          isSessionExpiredToastShown = false;
        }, 5000);
      }

      // If user was on a protected page, navigate to login
      const currentPath = window.location.pathname;
      const isProtectedPath = currentPath.startsWith('/admin') || currentPath.startsWith('/profile') || currentPath.startsWith('/student');
      if (isProtectedPath && currentPath !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

const persistor = persistStore(store);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
        <Toaster />
      </PersistGate>
    </Provider>
  </React.StrictMode>,
)
