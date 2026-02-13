import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const AuthPage = () => {
  const [role, setRole] = useState('Teacher');
  const [mode, setMode] = useState('login');
  const navigate = useNavigate();

  const isAdmin = role === 'Admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const values = Object.fromEntries(data.entries());

    try {
      let response;

      if (isAdmin) {
        // Admin login
        response = await fetch('https://invigilo-backend.onrender.com/api/login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: values.username,
            password: values.password,
            role: 'Admin',
          }),
        });
      } else {
        if (mode === 'signup') {
          // Teacher Signup
          response = await fetch('https://invigilo-backend.onrender.com/api/signup/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: values.username,
              password: values.password,
              email: values.email,
              name: values.fullName,
              subject: values.subject,
            }),
          });
        } else {
          // Teacher Login
          response = await fetch('https://invigilo-backend.onrender.com/api/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: values.username,
              password: values.password,
              role: 'Teacher',
            }),
          });
        }
      }

      if (response.ok) {
        const responseData = await response.json();
        e.target.reset();

        console.log('Login response:', responseData); // Debug log

        // ✅ Redirect based on role & mode
        if (isAdmin && mode === 'login') {
          localStorage.setItem("role", "admin");
          localStorage.setItem("adminUser", values.username);
          navigate('/'); // 🔹 redirect to admin page
        } 
        else if (!isAdmin && mode === 'login') {
          // Store teacher data properly for dashboard
          localStorage.setItem("role", "teacher");
          
          // Use the teacher's actual name from response if available, otherwise use username
          const teacherName = responseData.name || values.fullName || values.username;
          const teacherId = responseData.id || responseData.teacher_id || Date.now(); // Use response ID or fallback
          
          localStorage.setItem("teacherName", teacherName);
          localStorage.setItem("teacherId", teacherId.toString());
          
          console.log('Stored teacher data:', {
            teacherName: localStorage.getItem("teacherName"),
            teacherId: localStorage.getItem("teacherId")
          });
          
          navigate('/teacher'); // 🔹 redirect to teacher dashboard
        } 
        else if (!isAdmin && mode === 'signup') {
          // Store teacher data properly for dashboard after signup
          localStorage.setItem("role", "teacher");
          
          // Use the provided full name for signup
          const teacherName = values.fullName;
          const teacherId = responseData.id || responseData.teacher_id || Date.now(); // Use response ID or fallback
          
          localStorage.setItem("teacherName", teacherName);
          localStorage.setItem("teacherId", teacherId.toString());
          
          console.log('Stored teacher data after signup:', {
            teacherName: localStorage.getItem("teacherName"),
            teacherId: localStorage.getItem("teacherId")
          });
          
          navigate('/teacher'); // 🔹 after signup, go to teacher dashboard
        }
      } else {
        const errorData = await response.json();
        alert(errorData.detail || errorData.message || 'Authentication failed.');
      }
    } catch (err) {
      alert('Server error. Please try again later.');
      console.error('Auth error:', err);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-header">
            <h2>
              {isAdmin
                ? 'Admin Login'
                : mode === 'signup'
                ? 'Teacher Signup'
                : 'Teacher Login'}
            </h2>
            <div className="switches">
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Teacher">Teacher</option>
                <option value="Admin">Admin</option>
              </select>
              {!isAdmin && (
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                >
                  {mode === 'login'
                    ? 'Need an account? Signup'
                    : 'Already have an account? Login'}
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${role}-${mode}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="form-fields"
              >
                {!isAdmin && mode === 'signup' && (
                  <>
                    <input type="text" name="fullName" placeholder="Full Name" required />
                    <input type="email" name="email" placeholder="Email" required />
                    <input type="text" name="subject" placeholder="Subject" required />
                  </>
                )}
                <input type="text" name="username" placeholder="Username" required />
                <input type="password" name="password" placeholder="Password" required />
                <button type="submit" className="submit-btn">
                  {mode === 'signup' ? 'Signup' : 'Login'}
                </button>
              </motion.div>
            </AnimatePresence>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;