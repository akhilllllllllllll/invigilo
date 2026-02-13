import React, { useState, useEffect } from "react";

const SchedulePage = () => {
  const [events, setEvents] = useState([]);
  const [file, setFile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    startTime: "09:00",
    endTime: "12:00",
    hall: ""
  });
  const [halls] = useState([
    { id: 1, name: "Hall A" },
    { id: 2, name: "Hall B" },
    { id: 3, name: "Hall C" },
    { id: 4, name: "Main Hall" }
  ]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Load events from localStorage on component mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('examScheduleEvents');
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents);
        setEvents(parsedEvents);
      } catch (error) {
        console.error('Error loading saved events:', error);
      }
    }
  }, []);

  // Save events to localStorage whenever events change
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem('examScheduleEvents', JSON.stringify(events));
    }
  }, [events]);

  // Mock OCR response for demo - using current month dates
  const getCurrentMonthDates = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    
    return `
      Monday
      15.${month}.${year}
      IMCA8C02 Artificial Intelligence
      
      Tuesday  
      20.${month}.${year}
      IMCA8C03 Machine Learning
      
      Wednesday
      25.${month}.${year}
      IMCA8C04 Data Science
      Elective III (a-d)
      
      Friday
      28.${month}.${year}
      IMCA8C05 Computer Networks
    `;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
      } else {
        alert("Please select a valid image file (PNG or JPG)");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    try {
      // Mock OCR processing - replace with your actual API
      const extractedText = getCurrentMonthDates();
      const parsedEvents = parseTimetable(extractedText);
      
      if (parsedEvents.length > 0) {
        setEvents(prev => [...prev, ...parsedEvents]);
        alert(`Successfully added ${parsedEvents.length} exams to calendar!`);
        setFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } else {
        alert("No valid exam data found in the image!");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to process image!");
    }
  };

  const parseTimetable = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const events = [];
    let currentDate = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip weekday names
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      if (weekdays.includes(line)) continue;

      // Match date patterns: DD.MM.YYYY
      const dateMatch = line.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const formattedDay = day.padStart(2, '0');
        const formattedMonth = month.padStart(2, '0');
        currentDate = `${year}-${formattedMonth}-${formattedDay}`;
        continue;
      }

      // Match subject patterns
      if (currentDate) {
        const subjectMatch = line.match(/^([A-Z0-9]+)\s+(.+)$/);
        if (subjectMatch) {
          const [, code, subject] = subjectMatch;
          
          if (/elective\s*iii/i.test(subject)) {
            if (!events.some(e => e.start === currentDate && /elective\s*iii/i.test(e.title))) {
              events.push({
                id: `${currentDate}-elective-${Date.now()}`,
                title: "Elective III (a-d)",
                start: currentDate,
                backgroundColor: "#ff6b6b",
                textColor: "#fff",
                extendedProps: { code: "ELEC3", type: "elective" }
              });
            }
          } else {
            events.push({
              id: `${currentDate}-${code}-${Date.now()}`,
              title: `${subject} (${code})`,
              start: currentDate,
              backgroundColor: "#4ecdc4",
              textColor: "#fff",
              extendedProps: { code, type: "regular" }
            });
          }
        } else if (/elective\s*iii/i.test(line)) {
          if (!events.some(e => e.start === currentDate && /elective\s*iii/i.test(e.title))) {
            events.push({
              id: `${currentDate}-elective-${Date.now()}`,
              title: "Elective III (a-d)",
              start: currentDate,
              backgroundColor: "#ff6b6b",
              textColor: "#fff",
              extendedProps: { code: "ELEC3", type: "elective" }
            });
          }
        }
      }
    }

    return events;
  };

  const handleDateClick = (date) => {
    setFormData({
      title: "",
      date: date,
      startTime: "09:00",
      endTime: "12:00",
      hall: ""
    });
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleEventClick = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.start,
      startTime: event.startTime || "09:00",
      endTime: event.endTime || "12:00",
      hall: event.extendedProps?.hall || ""
    });
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      alert("Please enter a subject name!");
      return;
    }

    const newEvent = {
      id: editingEvent ? editingEvent.id : `manual-${Date.now()}`,
      title: formData.title.trim(),
      start: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      backgroundColor: editingEvent ? editingEvent.backgroundColor : "#45b7d1",
      textColor: "#fff",
      extendedProps: {
        hall: formData.hall,
        type: "manual"
      }
    };

    if (editingEvent) {
      setEvents(prev => prev.map(event => 
        event.id === editingEvent.id ? newEvent : event
      ));
    } else {
      setEvents(prev => [...prev, newEvent]);
    }

    closeForm();
  };

  const handleDelete = () => {
    if (!editingEvent) return;
    
    if (window.confirm("Are you sure you want to delete this exam?")) {
      const updatedEvents = events.filter(event => event.id !== editingEvent.id);
      setEvents(updatedEvents);
      
      // Update localStorage
      if (updatedEvents.length === 0) {
        localStorage.removeItem('examScheduleEvents');
      } else {
        localStorage.setItem('examScheduleEvents', JSON.stringify(updatedEvents));
      }
      
      closeForm();
    }
  };

  const clearAllEvents = () => {
    if (window.confirm("Are you sure you want to clear all exams? This cannot be undone.")) {
      setEvents([]);
      localStorage.removeItem('examScheduleEvents');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEvent(null);
    setFormData({
      title: "",
      date: "",
      startTime: "09:00",
      endTime: "12:00",
      hall: ""
    });
  };

  const generateCalendarDays = () => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const today = new Date();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateStr = current.toISOString().split('T')[0];
      const dayEvents = events.filter(event => event.start === dateStr);
      
      days.push({
        date: new Date(current),
        dateStr,
        isCurrentMonth: current.getMonth() === currentMonth,
        isToday: current.toDateString() === today.toDateString(),
        events: dayEvents
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const calendarDays = generateCalendarDays();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const today = new Date();

  return (
    <div style={{
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '16px',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', fontWeight: '700' }}>
          Exam Schedule
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>
          Manage your exam timetable with ease
        </p>
      </div>

      {/* Upload Section */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '12px',
        marginBottom: '25px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#2d3748', fontSize: '1.3rem' }}>
          📸 Upload Timetable Screenshot
        </h3>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#e2e8f0',
            border: '2px dashed #a0aec0',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            📁 Choose File
          </label>
          {file && (
            <span style={{ color: '#48bb78', fontWeight: '500' }}>
              ✓ {file.name}
            </span>
          )}
          <button
            onClick={handleUpload}
            disabled={!file}
            style={{
              padding: '12px 24px',
              backgroundColor: file ? '#48bb78' : '#a0aec0',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: file ? 'pointer' : 'not-allowed',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            🚀 Upload & Process
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '25px',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleDateClick(new Date().toISOString().split('T')[0])}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4299e1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            ➕ Add Exam Manually
          </button>
          
          {events.length > 0 && (
            <button
              onClick={clearAllEvents}
              style={{
                padding: '12px 24px',
                backgroundColor: '#e53e3e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              🗑️ Clear All
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {events.length > 0 && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#e6fffa',
              borderRadius: '6px',
              border: '1px solid #4fd1c7',
              color: '#234e52',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              📚 {events.length} exam{events.length !== 1 ? 's' : ''} scheduled
            </div>
          )}
          
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            color: '#4a5568',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <button 
              onClick={() => navigateMonth(-1)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: '#4299e1'
              }}
            >
              ‹
            </button>
            📅 {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            <button 
              onClick={() => navigateMonth(1)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: '#4299e1'
              }}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Custom Calendar */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* Calendar Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          backgroundColor: '#f7fafc',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{
              padding: '15px 10px',
              textAlign: 'center',
              fontWeight: '600',
              color: '#4a5568',
              fontSize: '0.9rem'
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          backgroundColor: '#e2e8f0'
        }}>
          {calendarDays.map((day, index) => (
            <div
              key={index}
              onClick={() => handleDateClick(day.dateStr)}
              style={{
                minHeight: '100px',
                backgroundColor: 'white',
                cursor: 'pointer',
                padding: '8px',
                position: 'relative',
                border: day.isToday ? '2px solid #4299e1' : 'none',
                opacity: day.isCurrentMonth ? 1 : 0.3,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                fontWeight: day.isToday ? '700' : '500',
                color: day.isToday ? '#4299e1' : day.isCurrentMonth ? '#2d3748' : '#a0aec0',
                marginBottom: '4px',
                fontSize: '0.9rem'
              }}>
                {day.date.getDate()}
              </div>
              
              {day.events.map((event, eventIndex) => (
                <div
                  key={eventIndex}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(event);
                  }}
                  style={{
                    backgroundColor: event.backgroundColor,
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    marginBottom: '2px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: '500'
                  }}
                  title={event.title}
                >
                  {event.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={closeForm}
        >
          <div 
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '16px',
              minWidth: '450px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              margin: '0 0 25px 0',
              color: '#2d3748',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              {editingEvent ? '✏️ Edit Exam' : '➕ Add New Exam'}
            </h3>
            
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#4a5568'
                }}>
                  Subject Name *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter subject name..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#4a5568'
                }}>
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#4a5568'
                  }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#4a5568'
                  }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#4a5568'
                }}>
                  Exam Hall
                </label>
                <select
                  name="hall"
                  value={formData.hall}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Hall</option>
                  {halls.map(hall => (
                    <option key={hall.id} value={hall.name}>{hall.name}</option>
                  ))}
                </select>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={closeForm}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#e2e8f0',
                    color: '#4a5568',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Cancel
                </button>
                
                {editingEvent && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#e53e3e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🗑️ Delete
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={handleSubmit}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#48bb78',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {editingEvent ? '💾 Update' : '➕ Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;