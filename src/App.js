import './App.css';
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';



import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import Body from './components/Body';
import Footer from './components/Footer';

import AssignTeachers from './pages/at';
import AuthPage from './pages/AuthPage';
import SchedulePage from "./pages/schedulepage";

// 🌀 Lazy load other big components
const RoomA1 = React.lazy(() => import('./pages/roomsa1'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const TeacherManagement = React.lazy(() => import('./pages/TeacherManagement'));
const StudentManagement = React.lazy(() => import('./pages/StudentManagement'));
const SubjectManagement = React.lazy(() => import('./pages/SubjectManagement'));
const ClassManagement = React.lazy(() => import('./pages/ClassManagement'));
const ExamManagement = React.lazy(() => import('./pages/ExamManagement'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const UserPermissions = React.lazy(() => import('./pages/UserPermissions'));
const Setting = React.lazy(() => import('./pages/Setting'));
const ReportManagement = React.lazy(() => import('./pages/ReportManagement'));
const Teacher = React.lazy(() => import('./pages/teacher')); // <-- Teacher page

function PageFade({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35, ease: [0.77, 0, 0.18, 1] }}
      style={{ minHeight: '60vh' }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageFade><HeroSection /><Body /></PageFade>} />
        <Route path="/dashboard" element={<PageFade><Dashboard /></PageFade>} />
        <Route path="/teacher-management" element={<PageFade><TeacherManagement /></PageFade>} />
        <Route path="/student-management" element={<PageFade><StudentManagement /></PageFade>} />
        <Route path="/subject-management" element={<PageFade><SubjectManagement /></PageFade>} />
        <Route path="/class-management" element={<PageFade><ClassManagement /></PageFade>} />
        <Route path="/exam-management" element={<PageFade><ExamManagement /></PageFade>} />
        <Route path="/user-management" element={<PageFade><UserManagement /></PageFade>} />
        <Route path="/user-permissions" element={<PageFade><UserPermissions /></PageFade>} />
        <Route path="/setting" element={<PageFade><Setting /></PageFade>} />
        <Route path="/report-management" element={<PageFade><ReportManagement /></PageFade>} />
        <Route path="/classrooms/room-rooma1" element={<PageFade><RoomA1 /></PageFade>} />
        <Route path="/assign-teachers" element={<PageFade><AssignTeachers /></PageFade>} />
        <Route path="/auth" element={<PageFade><AuthPage /></PageFade>} />
        <Route path="/teacher" element={<PageFade><Teacher /></PageFade>} /> {/* Teacher page */}
        <Route path="/schedulepage" element={<SchedulePage />} />

      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const location = useLocation();

  // ⬇️ Hide Navbar on teacher OR auth page
  const hideNavbar =
    location.pathname.startsWith('/teacher') ||
    location.pathname.startsWith('/auth');

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      <div style={{ display: 'flex', position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <div className="main-content" style={{ flex: 1, minHeight: '100vh', background: 'transparent', zIndex: 2 }}>
          {!hideNavbar && <Navbar />}
          <Suspense fallback={<div style={{ textAlign: 'center', paddingTop: '50px' }}>Loading...</div>}>
            <AnimatedRoutes />
          </Suspense>
          <Footer />
        </div>
      </div>
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;
