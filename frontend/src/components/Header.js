import React, { useState, useEffect, useRef } from 'react';
import ThemeToggle from './ThemeToggle';
import { GoogleLogin } from '@react-oauth/google';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, NavLink } from 'react-router-dom';

function Header({ isDark, onThemeToggle, children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const dropdownRef = useRef(null);
  const toolsMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target)) {
        setShowToolsMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('googleToken');
      
      if (!token) return;

      try {
        if (!token.includes('.') || token.split('.').length !== 3) {
          throw new Error('Invalid token format');
        }

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        
        if (payload.exp * 1000 < Date.now()) {
          handleLogout();
          toast.info('Session expired. Please login again.', {
            position: "top-right",
            autoClose: 5000,
          });
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        handleLogout();
        toast.error('Invalid session. Please login again.', {
          position: "top-right",
          autoClose: 5000,
        });
      }
    };

    checkTokenExpiration();
    const interval = setInterval(checkTokenExpiration, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleGoogleSuccess = async (response) => {
    try {
      const result = await fetch(`${process.env.REACT_APP_API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: response.credential })
      });

      const data = await result.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('googleToken', response.credential);
      } else if (result.status === 403) {
        toast.error('Only stepup.com.vn and stepup.vn email domains are allowed.', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('googleToken');
  };

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <a href="/" className="logo-text">AI Tools</a>
          </div>

          <button
            className="mobile-menu-button"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>

          <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <div className="nav-links">
              <NavLink to="/" className="nav-link">Home</NavLink>
              {user && (
                <div className="tools-dropdown" ref={toolsMenuRef}>
                  <button 
                    className="nav-link tools-button"
                    onClick={() => setShowToolsMenu(!showToolsMenu)}
                  >
                    Tools ▾
                  </button>
                  {showToolsMenu && (
                    <div className="tools-menu">
                      <NavLink 
                        to="/onion-world" 
                        className="tools-menu-item"
                        onClick={() => setShowToolsMenu(false)}
                      >
                        Onion World
                      </NavLink>
                      <NavLink 
                        to="/qc-tts" 
                        className="tools-menu-item"
                        onClick={() => setShowToolsMenu(false)}
                      >
                        QC TTS
                      </NavLink>
                      <NavLink 
                        to="/audio-stream" 
                        className="tools-menu-item"
                        onClick={() => setShowToolsMenu(false)}
                      >
                        Stream
                      </NavLink>
                    </div>
                  )}
                </div>
              )}
              {children}
            </div>

            <div className="nav-controls">
              <ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
              {!user ? (
                <div className="login-container">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => console.log('Login Failed')}
                  />
                </div>
              ) : (
                <div className="user-profile">
                  <div className="user-avatar-container" ref={dropdownRef}>
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="user-avatar"
                      onClick={toggleDropdown}
                    />
                    {showDropdown && (
                      <div className="user-dropdown">
                        <span>{user.name}</span>
                        <button onClick={handleLogout}>Logout</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>
      <ToastContainer theme={isDark ? "dark" : "light"} />
    </>
  );
}

export default Header; 