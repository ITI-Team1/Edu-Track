import React from 'react';
import { ToastContainer, Slide } from 'react-toastify';
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
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Slide}
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