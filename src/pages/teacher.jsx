import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, Edit3, AlertTriangle, Send } from 'lucide-react';

const TeacherDashboard = () => {
  const navigate = () => {
    // Simple navigation - you can replace this with your routing logic
    window.location.href = '/auth';
  };
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [availability, setAvailability] = useState({});
  const [teacherName, setTeacherName] = useState("");
  const [teacherId, setTeacherId] = useState(null);
  const [myAssignments, setMyAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [halls, setHalls] = useState([]);
  const [requests, setRequests] = useState([]);

  // Load teacher data and assignments
  useEffect(() => {
    const storedName = localStorage.getItem("teacherName");
    const storedId = localStorage.getItem("teacherId");
    
    if (!storedId || !storedName) {
      // If no teacher is logged in, redirect to auth
      console.warn("No teacher logged in, redirecting to auth");
      navigate();
      return;
    }
    
    const currentTeacherId = parseInt(storedId);
    setTeacherName(storedName);
    setTeacherId(currentTeacherId);

    loadTeacherData(currentTeacherId);
  }, []);

  const loadTeacherData = async (currentTeacherId) => {
    try {
      console.log("Loading data for teacher ID:", currentTeacherId);
      
      // Load assignments from admin dashboard
      const savedAssignments = localStorage.getItem('examAssignments');
      const allAssignments = savedAssignments ? JSON.parse(savedAssignments) : [];
      
      console.log("All assignments:", allAssignments);
      
      // Filter assignments for current teacher - be more strict with the filtering
      const teacherAssignments = allAssignments.filter(assignment => {
        // Convert both to numbers to ensure proper comparison
        const assignmentTeacherId = parseInt(assignment.teacherId);
        const currentId = parseInt(currentTeacherId);
        
        console.log(`Comparing assignment teacherId: ${assignmentTeacherId} with current: ${currentId}`);
        return assignmentTeacherId === currentId;
      });
      
      console.log("Filtered teacher assignments:", teacherAssignments);
      setMyAssignments(teacherAssignments);

      // Load availability
      const savedAvailability = localStorage.getItem(`teacherAvailability_${currentTeacherId}`);
      if (savedAvailability) {
        setAvailability(JSON.parse(savedAvailability));
      }

      // Load requests
      const savedRequests = localStorage.getItem(`teacherRequests_${currentTeacherId}`);
      if (savedRequests) {
        setRequests(JSON.parse(savedRequests));
      }

      // Load teachers and halls for request form
      try {
        const teacherRes = await fetch('https://invigilo-backend.onrender.com/api/teachers/');
        const hallRes = await fetch('https://invigilo-backend.onrender.com/api/halls/');
        
        if (teacherRes.ok) setTeachers(await teacherRes.json());
        if (hallRes.ok) setHalls(await hallRes.json());
      } catch (error) {
        console.log('API not available, using fallback data');
        setHalls([
          { id: 1, hall_id: 'Hall A' },
          { id: 2, hall_id: 'Hall B' },
          { id: 3, hall_id: 'Hall C' }
        ]);
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
    }
  };

  const teacherInfo = {
    name: teacherName,
    employeeId: `T-2024-${String(teacherId).padStart(3, '0')}`,
    department: "Computer Science",
    email: `${teacherName.toLowerCase().replace(/\s+/g, '.')}@university.edu`
  };

  const saveAvailability = (newAvailability) => {
    if (!teacherId) return;
    localStorage.setItem(`teacherAvailability_${teacherId}`, JSON.stringify(newAvailability));
    setAvailability(newAvailability);
  };

  const saveRequests = (newRequests) => {
    if (!teacherId) return;
    localStorage.setItem(`teacherRequests_${teacherId}`, JSON.stringify(newRequests));
    setRequests(newRequests);
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Check if teacher has exam on this date - only check current teacher's assignments
      const hasExam = myAssignments.some(assignment => {
        const examDate = new Date(assignment.examDate);
        return examDate.getDate() === day && examDate.getMonth() === month && examDate.getFullYear() === year;
      });

      // Get exam details for this date - only from current teacher's assignments
      const dayExam = myAssignments.find(assignment => {
        const examDate = new Date(assignment.examDate);
        return examDate.getDate() === day && examDate.getMonth() === month && examDate.getFullYear() === year;
      });

      days.push({
        day,
        dateStr,
        isToday: day === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
        hasExam,
        examDetails: dayExam,
        isAvailable: availability[dateStr] !== undefined ? availability[dateStr] : null
      });
    }
    return days;
  };

  const handleDateClick = (dateInfo) => {
    if (dateInfo) {
      setSelectedDate(dateInfo);
      setShowAvailabilityModal(true);
    }
  };

  const handleAvailabilityChange = (isAvailable) => {
    const newAvailability = {
      ...availability,
      [selectedDate.dateStr]: isAvailable
    };
    saveAvailability(newAvailability);
    setShowAvailabilityModal(false);
    setSelectedDate(null);
  };

  const handleRequestChange = (exam) => {
    setSelectedExam(exam);
    setShowRequestModal(true);
  };

  const submitChangeRequest = (requestData) => {
    const newRequest = {
      id: Date.now(),
      examId: selectedExam.examId,
      examTitle: selectedExam.examTitle,
      currentHall: selectedExam.hallName,
      requestedHall: requestData.hall,
      reason: requestData.reason,
      requestType: requestData.type,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      teacherId: teacherId,
      teacherName: teacherName
    };

    const updatedRequests = [...requests, newRequest];
    saveRequests(updatedRequests);
    
    // Also save to admin requests for review
    const adminRequests = JSON.parse(localStorage.getItem('adminChangeRequests') || '[]');
    adminRequests.push(newRequest);
    localStorage.setItem('adminChangeRequests', JSON.stringify(adminRequests));

    setShowRequestModal(false);
    setSelectedExam(null);
    alert('Request submitted successfully! Admin will review your request.');
  };

  const getUpcomingExams = () => {
    const today = new Date();
    return myAssignments
      .filter(assignment => new Date(assignment.examDate) >= today)
      .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
      .slice(0, 5);
  };

  const getMyHalls = () => {
    const uniqueHalls = [...new Set(myAssignments.map(assignment => assignment.hallName))];
    return uniqueHalls.filter(hall => hall); // Remove any undefined/null halls
  };

  // Show loading or redirect if no teacher is logged in
  if (!teacherId || !teacherName) {
    return (
      <div style={{...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={styles.card}>
          <h3>Please log in to access the teacher dashboard</h3>
          <button onClick={navigate} style={styles.submitButton}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonth = monthNames[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navbarContainer}>
          <div style={styles.navbarLogo}>Invigilo</div>
          <ul style={styles.navbarMenu}>
            <li><a href="#" style={styles.navLink}>🏠 Dashboard</a></li>
            <li><a href="#" style={styles.navLink}>🏢 My Exam Halls</a></li>
            <li><a href="#" style={styles.navLink}>📅 My Schedule</a></li>
          </ul>
          <div
            style={styles.navbarProfile}
            onClick={() => navigate()}
          >
            <User size={16} />
            <span style={{ marginLeft: "6px" }}>{teacherInfo.name} (ID: {teacherId})</span>
          </div>
        </div>
      </nav>

      <div style={styles.content}>
        {/* Teacher Info */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.avatarLarge}>
              <User size={24} />
            </div>
            <div>
              <h2 style={styles.welcomeText}>Welcome back, {teacherName}</h2>
              <p style={styles.teacherDetails}>{teacherInfo.employeeId} • {teacherInfo.department}</p>
              <p style={styles.emailText}>{teacherInfo.email}</p>
            </div>
          </div>
          <div style={styles.cardDate}>
            <p style={styles.todayLabel}>Today</p>
            <p style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsContainer}>
          <StatCard 
            icon="📚" 
            title="Total Assignments" 
            value={myAssignments.length}
            color="#4299e1"
          />
          <StatCard 
            icon="⏰" 
            title="Upcoming Exams" 
            value={getUpcomingExams().length}
            color="#48bb78"
          />
          <StatCard 
            icon="🏢" 
            title="Assigned Halls" 
            value={getMyHalls().length}
            color="#9f7aea"
          />
          <StatCard 
            icon="📝" 
            title="Pending Requests" 
            value={requests.filter(r => r.status === 'Pending').length}
            color="#ed8936"
          />
        </div>

        <div style={styles.grid}>
          <div style={styles.mainSection}>
            {/* Assigned Exam Halls */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                <MapPin size={18} /> My Assigned Exam Halls
              </h3>
              <div style={styles.hallsList}>
                {getMyHalls().length > 0 ? (
                  getMyHalls().map((hall, index) => (
                    <div key={index} style={styles.hallItem}>
                      <div style={styles.hallInfo}>
                        <strong>{hall}</strong>
                        <p>{myAssignments.filter(a => a.hallName === hall).length} assignments</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={styles.noDataText}>No halls assigned yet</p>
                )}
              </div>
            </div>

            {/* Exam Schedule */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                <Clock size={18} /> My Exam Schedule & Duties
              </h3>
              <div style={styles.examsList}>
                {myAssignments.length > 0 ? (
                  myAssignments.map((assignment, i) => (
                    <div key={i} style={styles.examItem}>
                      <div style={styles.examDetails}>
                        <strong style={styles.examSubject}>{assignment.examTitle}</strong>
                        <p style={styles.examDateTime}>
                          {new Date(assignment.examDate).toLocaleDateString()} • {assignment.examTime}
                        </p>
                        <p style={styles.examLocation}>
                          📍 {assignment.hallName} • 👤 Invigilator
                        </p>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: assignment.status === 'Auto-Assigned' ? '#9f7aea' : '#48bb78'
                        }}>
                          {assignment.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRequestChange(assignment)}
                        style={styles.requestButton}
                        title="Request Change"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={styles.noDataText}>
                    <p>No exams assigned yet</p>
                    <small>Teacher ID: {teacherId} • Check with admin if you should have assignments</small>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Requests */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                <Send size={18} /> My Change Requests
              </h3>
              <div style={styles.requestsList}>
                {requests.length > 0 ? (
                  requests.slice(0, 3).map((request, i) => (
                    <div key={i} style={styles.requestItem}>
                      <div>
                        <strong>{request.examTitle}</strong>
                        <p>{request.reason}</p>
                        <small>{request.currentHall} → {request.requestedHall}</small>
                      </div>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: 
                          request.status === 'Pending' ? '#ed8936' :
                          request.status === 'Approved' ? '#48bb78' : '#e53e3e'
                      }}>
                        {request.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={styles.noDataText}>No requests submitted</p>
                )}
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div style={styles.calendarSection}>
            <h3 style={styles.cardTitle}>
              <Calendar size={18} /> Availability Calendar
            </h3>
            <h4 style={styles.monthYear}>{currentMonth} {currentYear}</h4>
            <div style={styles.calendarGrid}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={styles.calendarDayName}>{day}</div>
              ))}
              {generateCalendarDays().map((dateInfo, idx) => (
                <div
                  key={idx}
                  style={{
                    ...styles.calendarDay,
                    ...(dateInfo?.isToday ? styles.todayStyle : {}),
                    ...(dateInfo?.hasExam ? styles.examDayStyle : {})
                  }}
                  onClick={() => handleDateClick(dateInfo)}
                >
                  {dateInfo?.day}
                  {dateInfo?.hasExam && (
                    <div style={styles.examIndicator} title={dateInfo.examDetails?.examTitle}>
                      📚
                    </div>
                  )}
                  {dateInfo?.isAvailable === true && <CheckCircle size={10} style={styles.availableIcon} />}
                  {dateInfo?.isAvailable === false && <XCircle size={10} style={styles.notAvailableIcon} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Availability Modal */}
      {showAvailabilityModal && selectedDate && (
        <Modal
          title="Set Availability"
          onClose={() => setShowAvailabilityModal(false)}
        >
          <p>Set your availability for {selectedDate.day} {currentMonth}, {currentYear}</p>
          {selectedDate.hasExam && (
            <div style={styles.warningBox}>
              <AlertTriangle size={16} />
              <span>You have an exam scheduled on this date: {selectedDate.examDetails?.examTitle}</span>
            </div>
          )}
          <div style={styles.checkboxContainer}>
            <label style={styles.checkboxLabel}>
              <input 
                type="radio" 
                name="availability"
                checked={availability[selectedDate.dateStr] === true} 
                onChange={() => handleAvailabilityChange(true)} 
              />
              Available
            </label>
            <label style={styles.checkboxLabel}>
              <input 
                type="radio" 
                name="availability"
                checked={availability[selectedDate.dateStr] === false} 
                onChange={() => handleAvailabilityChange(false)} 
              />
              Not Available
            </label>
          </div>
          <div style={styles.modalActions}>
            <button onClick={() => setShowAvailabilityModal(false)} style={styles.cancelButton}>
              Cancel
            </button>
            <button 
              onClick={() => {
                const newAvailability = { ...availability };
                delete newAvailability[selectedDate.dateStr];
                saveAvailability(newAvailability);
                setShowAvailabilityModal(false);
              }}
              style={styles.clearButton}
            >
              Clear
            </button>
          </div>
        </Modal>
      )}

      {/* Request Change Modal */}
      {showRequestModal && selectedExam && (
        <RequestChangeModal
          exam={selectedExam}
          halls={halls}
          onSubmit={submitChangeRequest}
          onClose={() => setShowRequestModal(false)}
        />
      )}
    </div>
  );
};

// Helper Components
function StatCard({ icon, title, value, color }) {
  return (
    <div style={{ ...styles.statCard, borderLeft: `4px solid ${color}` }}>
      <div style={styles.statIcon}>{icon}</div>
      <div>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statTitle}>{title}</div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function RequestChangeModal({ exam, halls, onSubmit, onClose }) {
  const [requestData, setRequestData] = useState({
    type: 'hall',
    hall: '',
    reason: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!requestData.reason.trim()) {
      alert('Please provide a reason for the request');
      return;
    }
    if (requestData.type === 'hall' && !requestData.hall) {
      alert('Please select a hall');
      return;
    }
    onSubmit(requestData);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>Request Change</h3>
        <p style={styles.modalSubtitle}>
          Exam: <strong>{exam.examTitle}</strong><br/>
          Current Hall: <strong>{exam.hallName}</strong>
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Request Type:</label>
            <select
              value={requestData.type}
              onChange={(e) => setRequestData({ ...requestData, type: e.target.value })}
              style={styles.select}
            >
              <option value="hall">Change Hall</option>
              <option value="date">Change Date</option>
              <option value="other">Other</option>
            </select>
          </div>

          {requestData.type === 'hall' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Preferred Hall:</label>
              <select
                value={requestData.hall}
                onChange={(e) => setRequestData({ ...requestData, hall: e.target.value })}
                style={styles.select}
                required
              >
                <option value="">Select Hall</option>
                {halls.map(hall => (
                  <option key={hall.id} value={hall.hall_id}>
                    {hall.hall_id}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Reason for Request:</label>
            <textarea
              value={requestData.reason}
              onChange={(e) => setRequestData({ ...requestData, reason: e.target.value })}
              style={styles.textarea}
              placeholder="Please explain why you need this change..."
              required
            />
          </div>

          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.submitButton}>
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    minHeight: '100vh',
    backgroundColor: '#f8fafc'
  },
  navbar: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e2e8f0',
    padding: '0 20px',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  navbarContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    height: '60px'
  },
  navbarLogo: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#2d3748'
  },
  navbarMenu: {
    display: 'flex',
    listStyle: 'none',
    gap: '30px',
    margin: 0,
    padding: 0
  },
  navLink: {
    textDecoration: 'none',
    color: '#4a5568',
    fontWeight: '500'
  },
  navbarProfile: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'background-color 0.2s'
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px 20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
    marginBottom: '24px'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  avatarLarge: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  welcomeText: {
    margin: '0 0 8px 0',
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#2d3748'
  },
  teacherDetails: {
    margin: '0 0 4px 0',
    color: '#718096',
    fontSize: '0.9rem'
  },
  emailText: {
    margin: 0,
    color: '#4299e1',
    fontSize: '0.9rem'
  },
  cardDate: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0'
  },
  todayLabel: {
    margin: '0 0 4px 0',
    color: '#718096',
    fontSize: '0.9rem'
  },
  dateText: {
    margin: 0,
    fontWeight: '600',
    color: '#2d3748'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
  },
  statIcon: {
    fontSize: '2rem'
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#2d3748',
    margin: 0
  },
  statTitle: {
    fontSize: '0.9rem',
    color: '#718096',
    margin: 0
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '30px'
  },
  mainSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  cardTitle: {
    margin: '0 0 20px 0',
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#2d3748',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  hallsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  hallItem: {
    padding: '16px',
    backgroundColor: '#f7fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  hallInfo: {
    margin: 0
  },
  examsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  examItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px',
    backgroundColor: '#f7fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  examDetails: {
    flex: 1
  },
  examSubject: {
    margin: '0 0 8px 0',
    color: '#2d3748'
  },
  examDateTime: {
    margin: '0 0 8px 0',
    color: '#4a5568',
    fontSize: '0.9rem'
  },
  examLocation: {
    margin: '0 0 8px 0',
    color: '#718096',
    fontSize: '0.9rem'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'white',
    display: 'inline-block'
  },
  requestButton: {
    padding: '8px',
    backgroundColor: '#4299e1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  requestsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  requestItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '12px',
    backgroundColor: '#f7fafc',
    borderRadius: '6px'
  },
  noDataText: {
    color: '#718096',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '20px'
  },
  calendarSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
    height: 'fit-content'
  },
  monthYear: {
    margin: '0 0 16px 0',
    color: '#4a5568'
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px'
  },
  calendarDayName: {
    padding: '8px',
    textAlign: 'center',
    fontWeight: '600',
    color: '#718096',
    fontSize: '0.8rem'
  },
  calendarDay: {
    minHeight: '40px',
    padding: '4px',
    textAlign: 'center',
    cursor: 'pointer',
    borderRadius: '4px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    transition: 'background-color 0.2s'
  },
  todayStyle: {
    backgroundColor: '#4299e1',
    color: 'white',
    fontWeight: '600'
  },
  examDayStyle: {
    backgroundColor: '#fed7d7',
    color: '#c53030'
  },
  examIndicator: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    fontSize: '0.6rem'
  },
  availableIcon: {
    position: 'absolute',
    bottom: '2px',
    left: '2px',
    color: '#48bb78'
  },
  notAvailableIcon: {
    position: 'absolute',
    bottom: '2px',
    left: '2px',
    color: '#e53e3e'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    minWidth: '400px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
  },
  modalTitle: {
    margin: '0 0 16px 0',
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#2d3748'
  },
  modalSubtitle: {
    margin: '0 0 20px 0',
    color: '#4a5568',
    lineHeight: '1.5'
  },
  warningBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#fed7d7',
    color: '#c53030',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '0.9rem'
  },
  checkboxContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    color: '#2d3748'
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '2px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '1rem',
    backgroundColor: 'white',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '2px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '1rem',
    backgroundColor: 'white',
    boxSizing: 'border-box',
    minHeight: '80px',
    resize: 'vertical'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#e2e8f0',
    color: '#4a5568',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  clearButton: {
    padding: '10px 20px',
    backgroundColor: '#ed8936',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#48bb78',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600'
  }
};

export default TeacherDashboard;