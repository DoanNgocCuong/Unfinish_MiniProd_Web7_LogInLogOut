import { useState, useEffect, useMemo } from 'react';
import apiService from './services/api';
import Header from './components/Header';
import Footer from './components/Footer';
import './styles/theme.css';
import './styles/sections.css';
import { useTranslation } from 'react-i18next';
import './i18n';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import BuildConversation from './pages/BuildConversation';
import { ChakraProvider, ColorModeScript, useColorMode } from '@chakra-ui/react';
import { extendTheme } from '@chakra-ui/react';
import OnionWorld from './pages/OnionWorld';
import QCTTS from './pages/QCTTS';
import AudioStream from './pages/AudioStream';
import ToolsGrid from './components/tools/ToolsGrid';

// Define the theme configuration
const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'light' ? 'rgba(0, 0, 0, 0.05)' : '#ffffff0d', // Light mode softer, keep original dark mode
      },
    }),
  },
});

// Add this protected route component
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');  // Or however you store your user data
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const PrivateRoute = ({ children }) => {
  const user = localStorage.getItem('user');  // Or however you store your user data
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { t, i18n } = useTranslation();
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const { colorMode, setColorMode } = useColorMode();
  const location = useLocation();

  // Memoize the data loading function
  const loadData = useMemo(() => async () => {
    if (!i18n.language) return;

    try {
      // Get welcome message
      const welcomeMessage = await apiService.getWelcomeMessage(i18n.language);
      setMessage(welcomeMessage);

      // Get users
      const userData = await apiService.getUsers(i18n.language);
      setUsers(userData);

      // Get departments
      const departmentData = await apiService.getDepartments(i18n.language);
      setDepartments(departmentData);
    } catch (error) {
      console.error('Error loading data:', error);
      setUsers([]);
    }
  }, [i18n.language]);

  // Single useEffect for initialization and data loading
  useEffect(() => {
    if (!isInitialized) {
      const savedLang = localStorage.getItem('language') || 'vi';
      i18n.changeLanguage(savedLang);
      setIsInitialized(true);
    } else {
      loadData();
    }
  }, [isInitialized, i18n, loadData]);

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-mode');
    if (savedTheme) {
      setColorMode(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, [setColorMode]);

  const handleThemeToggle = () => {
    const newTheme = colorMode === 'light' ? 'dark' : 'light';
    setColorMode(newTheme);
    localStorage.setItem('theme-mode', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <div className="App">
          <Header isDark={colorMode === 'dark'} onThemeToggle={handleThemeToggle}>
            <div className="header-content">
              <div className="logo">
                {/* Your logo content */}
              </div>
              <div className="header-right">
                <div className="language-switcher">
                  <select
                    value={i18n.language}
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="language-select"
                  >
                    <option value="en">English</option>
                    <option value="vi">Tiếng Việt</option>
                  </select>
                </div>
                {/* Theme toggle button */}
              </div>
            </div>
          </Header>
          <Routes>
            <Route 
              path="/" 
              element={
                <Home 
                  message={message} 
                  t={t} 
                  users={users} 
                  departments={departments} 
                >
                  <ToolsGrid />
                </Home>
              } 
            />
            <Route 
              path="/build-conversation" 
              element={
                <ProtectedRoute>
                  <BuildConversation />
                </ProtectedRoute>
              } 
            />
            <Route path="/onion-world" element={<OnionWorld />} />
            <Route path="/qc-tts" element={<QCTTS />} />
            <Route path="/audio-stream" element={<AudioStream />} />
          </Routes>
          {location.pathname === '/' && <Footer />}
        </div>
      </GoogleOAuthProvider>
    </ChakraProvider>
  );
}

export default App;
