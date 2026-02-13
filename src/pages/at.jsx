import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function AssignTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [teacherRes, classroomRes, assignmentRes] = await Promise.all([
        fetch('https://invigilo-backend.onrender.com/api/teachers/'),
        fetch('https://invigilo-backend.onrender.com/api/halls/'),
        fetch('https://invigilo-backend.onrender.com/api/assignments/'), // ✅ updated
      ]);

      const teachersData = await teacherRes.json();
      const classroomData = await classroomRes.json();
      const assignmentData = await assignmentRes.json();

      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setClassrooms(Array.isArray(classroomData) ? classroomData : []);
      setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setMessage('Error loading data.');
    }
  };

  const handleAssign = async () => {
    if (!selectedTeacherId || !selectedClassroomId) {
      setMessage('Please select both teacher and classroom.');
      return;
    }

    try {
      const res = await fetch('https://invigilo-backend.onrender.com/api/assign-teacher/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: selectedTeacherId,
          hall_id: selectedClassroomId,
        }),
      });

      if (res.ok) {
        await fetchAllData();
        setMessage('Teacher successfully assigned!');
      } else {
        setMessage('Assignment failed.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error.');
    }
  };

  const handleAutoAssign = async () => {
    try {
      const res = await fetch('https://invigilo-backend.onrender.com/api/assign-teacher/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ random: true }),
      });

      if (res.ok) {
        await fetchAllData();
        setMessage('Auto-assignment complete.');
      } else {
        setMessage('Auto-assignment failed.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error during auto-assign.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        backgroundImage: 'url("/images/at.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '60px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'start'
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '650px',
          width: '100%',
          boxShadow: '0 4px 40px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          color: '#222'
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
          Assign Teachers to Exam Halls
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px' }}>Select Teacher:</label>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ccc'
            }}
          >
            <option value="">-- Select --</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.user?.username || teacher.name} ({teacher.subject})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '6px' }}>Select Exam Hall:</label>
          <select
            value={selectedClassroomId}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ccc'
            }}
          >
            <option value="">-- Select --</option>
            {classrooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.hall_id}
              </option>
            ))}
          </select>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button
            onClick={handleAssign}
            style={{
              padding: '10px 25px',
              backgroundColor: '#4B0082',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Assign
          </button>

          <button
            onClick={handleAutoAssign}
            style={{
              padding: '10px 25px',
              backgroundColor: '#006e4b',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Auto Assign
          </button>
        </div>

        {message && (
          <p style={{ textAlign: 'center', color: '#4B0082', marginBottom: '20px' }}>
            {message}
          </p>
        )}

        <hr style={{ margin: '30px 0', borderColor: '#ddd' }} />

        <h3 style={{ marginBottom: '10px', textAlign: 'center' }}>Current Assignments</h3>
        <ul style={{ paddingLeft: '20px' }}>
          {Array.isArray(assignments) && assignments.length > 0 ? (
            assignments.map((a, idx) => (
              <li key={idx} style={{ marginBottom: '10px' }}>
                <strong>{a.teacher_name}</strong> → <strong>{a.hall_name}</strong>
              </li>
            ))
          ) : (
            <li>No assignments available.</li>
          )}
        </ul>
      </div>
    </motion.div>
  );
}

export default AssignTeachers;
