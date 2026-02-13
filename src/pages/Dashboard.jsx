import React, { useEffect, useState } from 'react';

function HeroSection() {
  const [teachers, setTeachers] = useState([]);
  const [examHalls, setExamHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showHallModal, setShowHallModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', subject: '' });
  const [newHall, setNewHall] = useState({ hall_id: '', capacity: '' }); // ✅ Use hall_id here

  const fetchData = async () => {
    try {
      const teacherRes = await fetch('https://invigilo-backend.onrender.com/api/teachers/');
      const hallRes = await fetch('https://invigilo-backend.onrender.com/api/halls/');
      setTeachers(await teacherRes.json());
      setExamHalls(await hallRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    await fetch('https://invigilo-backend.onrender.com/api/teachers/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTeacher),
    });
    setNewTeacher({ name: '', subject: '' });
    setShowTeacherModal(false);
    fetchData();
  };

  const handleHallSubmit = async (e) => {
    e.preventDefault();
    await fetch('https://invigilo-backend.onrender.com/api/halls/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHall),
    });
    setNewHall({ hall_id: '', capacity: '' });
    setShowHallModal(false);
    fetchData();
  };

  return (
    <div
      style={{
        backgroundImage: `url('/images/dashboard.jpg')`, // ✅ Correct path for public folder
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '60px 30px',
        backdropFilter: 'blur(3px)',
        color: '#fff',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '30px' }}>Manage Teachers and Exam Halls</p>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
          <button onClick={() => setShowTeacherModal(true)} style={buttonStyle}>+ Add Teacher</button>
          <button onClick={() => setShowHallModal(true)} style={buttonStyle}>+ Add Hall</button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
            <Card title="Teachers" data={teachers} renderItem={(t) => `${t.name} — ${t.subject}`} />
            <Card title="Exam Halls" data={examHalls} renderItem={(h) => `Hall ${h.hall_id} — Capacity: ${h.capacity}`} />
          </div>
        )}
      </div>

      {showTeacherModal && (
        <Modal
          title="Add Teacher"
          onClose={() => setShowTeacherModal(false)}
          onSubmit={handleTeacherSubmit}
          fields={[
            { placeholder: 'Name', value: newTeacher.name, onChange: e => setNewTeacher({ ...newTeacher, name: e.target.value }) },
            { placeholder: 'Subject', value: newTeacher.subject, onChange: e => setNewTeacher({ ...newTeacher, subject: e.target.value }) }
          ]}
        />
      )}

      {showHallModal && (
        <Modal
          title="Add Exam Hall"
          onClose={() => setShowHallModal(false)}
          onSubmit={handleHallSubmit}
          fields={[
            { placeholder: 'Hall ID', value: newHall.hall_id, onChange: e => setNewHall({ ...newHall, hall_id: e.target.value }) },
            { placeholder: 'Capacity', value: newHall.capacity, onChange: e => setNewHall({ ...newHall, capacity: e.target.value }) }
          ]}
        />
      )}
    </div>
  );
}

function Card({ title, data, renderItem }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.15)',
      padding: '20px',
      borderRadius: '12px',
      backdropFilter: 'blur(4px)',
      flex: '1',
      minWidth: '300px',
      color: '#fff'
    }}>
      <h3 style={{ fontSize: '1.4rem', marginBottom: '12px', fontWeight: '600' }}>{title}</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {data.map((item, i) => (
          <li key={i} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {renderItem(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Modal({ title, onClose, onSubmit, fields }) {
  return (
    <div style={modalOverlay}>
      <div style={modalStyle}>
        <h3 style={{ marginBottom: '20px' }}>{title}</h3>
        <form onSubmit={onSubmit}>
          {fields.map((field, idx) => (
            <input
              key={idx}
              type="text"
              placeholder={field.placeholder}
              value={field.value}
              onChange={field.onChange}
              required
              style={inputStyle}
            />
          ))}
          <div style={modalActions}>
            <button type="submit" style={submitBtn}>Submit</button>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==== Styles ====

const buttonStyle = {
  padding: '10px 20px',
  fontSize: '15px',
  borderRadius: '8px',
  border: 'none',
  background: '#ffffffcc',
  color: '#1d1a39',
  fontWeight: '600',
  cursor: 'pointer',
  transition: '0.3s',
};

const modalOverlay = {
  background: 'rgba(0,0,0,0.7)',
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalStyle = {
  background: '#fff',
  padding: '30px',
  borderRadius: '12px',
  minWidth: '300px',
  textAlign: 'center',
  boxShadow: '0 0 20px rgba(0,0,0,0.2)',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '12px',
  borderRadius: '6px',
  border: '1px solid #ccc',
};

const modalActions = {
  display: 'flex',
  justifyContent: 'center',
  gap: '10px',
};

const submitBtn = {
  padding: '10px 18px',
  background: '#f1f1f2ff',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};

const cancelBtn = {
  padding: '10px 18px',
  background: '#eee',
  color: '#333',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};

export default HeroSection;
