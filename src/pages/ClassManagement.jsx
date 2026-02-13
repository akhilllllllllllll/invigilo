import React, { useState, useRef } from "react";
import "./ClassroomLayout.css";

const AddClassroomModal = ({ isOpen, onClose, onAdd }) => {
  const [roomName, setRoomName] = useState("");
  const [floor, setFloor] = useState("");

  const handleSubmit = () => {
    if (roomName.trim() && floor.trim()) {
      onAdd({ name: roomName, floor: parseInt(floor) });
      setRoomName("");
      setFloor("");
      onClose();
    }
  };

  return (
    <div className={`modal-overlay ${isOpen ? "open" : ""}`} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{
          color: 'var(--raw-sienna-700)',
          fontFamily: 'Warbler, serif',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: '1.5rem',
          letterSpacing: '0.04em'
        }}>Add New Classroom</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0 0.5rem' }}>
          <input
            type="text"
            placeholder="Classroom Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            style={{
              border: '1.5px solid var(--raw-sienna-300)',
              borderRadius: '8px',
              padding: '0.7rem 1rem',
              fontSize: '1.1rem',
              background: 'var(--raw-sienna-50)',
              color: 'var(--raw-sienna-900)',
              fontWeight: 500
            }}
          />
          <input
            type="number"
            placeholder="Floor Number"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            style={{
              border: '1.5px solid var(--raw-sienna-300)',
              borderRadius: '8px',
              padding: '0.7rem 1rem',
              fontSize: '1.1rem',
              background: 'var(--raw-sienna-50)',
              color: 'var(--raw-sienna-900)',
              fontWeight: 500
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              onClick={handleSubmit}
              style={{
                background: 'var(--raw-sienna-500)',
                color: 'var(--raw-sienna-50)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.6rem 1.2rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.3s',
                fontSize: '1rem'
              }}
            >Add</button>
            <button
              className="close-btn"
              onClick={onClose}
              style={{
                background: 'var(--raw-sienna-200)',
                color: 'var(--raw-sienna-700)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.6rem 1.2rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.3s',
                fontSize: '1rem'
              }}
            >Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClassroomLayout = () => {
  const [classrooms, setClassrooms] = useState([
    { id: 1, name: "Room A1", floor: 1 },
    { id: 2, name: "Room A2", floor: 1 },
    { id: 3, name: "Room B1", floor: 2 },
    { id: 4, name: "Room B2", floor: 2 },
    { id: 5, name: "Room C1", floor: 3 },
    { id: 6, name: "Room C2", floor: 3 },
  ]);

  const [showModal, setShowModal] = useState(false);
  const scrollRef = useRef(null);

  const handleAddClassroom = (newClassroom) => {
    setClassrooms([...classrooms, { ...newClassroom, id: classrooms.length + 1 }]);
  };

  return (
    <div className="classroom-page" ref={scrollRef}>
      <h2 className="floating-title">Classroom Overview</h2>

      <AddClassroomModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAddClassroom}
      />

      <div className="classroom-grid">
        {/* Render all classrooms */}
        {classrooms.map((room, index) => {
          const roomPath = `/classrooms/room-${room.name.replace(/\s/g, '').toLowerCase()}`;
          return (
            <a
              key={room.id}
              href={roomPath}
              className="classroom-card"
              style={{ animationDelay: `${index * 0.1}s`, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              <div className="classroom-name">{room.name}</div>
              <div className="classroom-floor">Floor {room.floor}</div>
            </a>
          );
        })}
        {/* Add Classroom tile */}
        <div
          className="classroom-card add-classroom-tile"
          onClick={() => setShowModal(true)}
          style={{ cursor: 'pointer', background: 'var(--raw-sienna-100)', border: '#1D1A39', color: 'var(--raw-sienna-700)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px', transition: 'background 0.3s, border 0.3s' }}
        >
          <span style={{ fontSize: '2.5rem', color: '#1D1A39)', marginBottom: '0.5rem' }}>+</span>
          <span style={{ fontWeight: 700, color: '#1D1A39' }}>Add Classroom</span>
        </div>
      </div>
    </div>
  );
};

export default ClassroomLayout;
