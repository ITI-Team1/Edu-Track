import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toastify-overrides.css';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import PlexusBackground from './components/PlexusBackground.jsx';
import RoutesList from '../routes/RoutesList.jsx';
import ScrollToTop from './components/ScrollToTop'; 

const queryClient = new QueryClient();

function AppContent() {

  return (
    <div className="App">
      <PlexusBackground />
      <Navbar />
      <main className="main-content">
        <ScrollToTop />
        <RoutesList />
        <Footer />
      </main>
      {/* Global toast container so any page can show toasts */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}


export default App;