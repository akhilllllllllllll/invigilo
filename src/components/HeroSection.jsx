import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, CheckCircle, AlertTriangle, User } from 'lucide-react';

function HeroSection() {
  const [teachers, setTeachers] = useState([]);
  const [examHalls, setExamHalls] = useState([]);
  const [exams, setExams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal states
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showHallModal, setShowHallModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  
  // Form states
  const [newTeacher, setNewTeacher] = useState({ username: '', subject: '' });
  const [newHall, setNewHall] = useState({ hall_id: '', capacity: '' });
  const [assignmentForm, setAssignmentForm] = useState({
    examId: '',
    hallId: '',
    teacherId: ''
  });
  const [swapForm, setSwapForm] = useState({ teacher1Id: '', teacher2Id: '' });
  
  // Additional states
  const [teacherRequests, setTeacherRequests] = useState([]);
  const [teacherAvailability, setTeacherAvailability] = useState({});

  // Load data from localStorage and API
  const fetchData = async () => {
    try {
      // Load exams from localStorage (from schedule page)
      const savedEvents = localStorage.getItem('examScheduleEvents');
      if (savedEvents) {
        const parsedExams = JSON.parse(savedEvents);
        console.log('Loaded exams from schedule page:', parsedExams);
        setExams(parsedExams);
      } else {
        console.log('No exams found in localStorage');
      }

      // Load assignments from localStorage
      const savedAssignments = localStorage.getItem('examAssignments');
      if (savedAssignments) {
        const parsedAssignments = JSON.parse(savedAssignments);
        console.log('Loaded assignments:', parsedAssignments);
        setAssignments(parsedAssignments);
      }

      // Load teacher requests from localStorage
      const savedRequests = localStorage.getItem('adminChangeRequests');
      if (savedRequests) {
        setTeacherRequests(JSON.parse(savedRequests));
      }

      // Load teacher availability data
      const availabilityData = {};
      for (let i = 1; i <= 10; i++) {
        const teacherAvail = localStorage.getItem(`teacherAvailability_${i}`);
        if (teacherAvail) {
          availabilityData[i] = JSON.parse(teacherAvail);
        }
      }
      setTeacherAvailability(availabilityData);

      // Fetch teachers and halls from your existing API
      try {
        console.log('Fetching teachers from API...');
        const teacherRes = await fetch('https://invigilo-backend.onrender.com/api/teachers/');
        const hallRes = await fetch('https://invigilo-backend.onrender.com/api/halls/');
        
        if (teacherRes.ok && hallRes.ok) {
          const teachersData = await teacherRes.json();
          const hallsData = await hallRes.json();
          
          console.log('Teachers fetched:', teachersData);
          console.log('Halls fetched:', hallsData);
          
          setTeachers(teachersData);
          setExamHalls(hallsData);
        } else {
          throw new Error(`API Error: Teachers ${teacherRes.status}, Halls ${hallRes.status}`);
        }
      } catch (apiError) {
        console.error('API fetch failed, using fallback data:', apiError);
        // Only use fallback if API completely fails
        setTeachers([
          { id: 1, user: { first_name: 'John Smith' }, subject: 'Computer Science' },
          { id: 2, user: { first_name: 'Sarah Wilson' }, subject: 'Mathematics' },
          { id: 3, user: { first_name: 'Mike Johnson' }, subject: 'Physics' }
        ]);
        setExamHalls([
          { id: 1, hall_id: 'Hall A', capacity: 120 },
          { id: 2, hall_id: 'Hall B', capacity: 100 },
          { id: 3, hall_id: 'Hall C', capacity: 80 },
          { id: 4, hall_id: 'Main Hall', capacity: 200 }
        ]);
      }
    } catch (err) {
      console.error('Error in fetchData:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save assignments to localStorage
  const saveAssignments = (newAssignments) => {
    localStorage.setItem('examAssignments', JSON.stringify(newAssignments));
    setAssignments(newAssignments);
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();

    if (!newTeacher.username.trim() || !newTeacher.subject.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const payload = {
        user: {
          username: newTeacher.username,
          email: `${newTeacher.username}@example.com`,
          password: 'default1234',
          first_name: newTeacher.username
        },
        subject: newTeacher.subject
      };

      console.log('Creating teacher with payload:', payload);

      const response = await fetch('https://invigilo-backend.onrender.com/api/teachers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newTeacherData = await response.json();
        console.log('Teacher created successfully:', newTeacherData);
        
        // Refresh the teachers list from API
        await fetchData();
        alert('Teacher added successfully!');
      } else {
        const errorData = await response.text();
        console.error('API Error:', response.status, errorData);
        throw new Error(`Failed to create teacher: ${response.status}`);
      }
    } catch (error) {
      console.error('Error creating teacher:', error);
      alert('Failed to add teacher. Please check the console for details.');
      
      // Don't add to local state if API exists - maintain data consistency
      return;
    }

    setNewTeacher({ username: '', subject: '' });
    setShowTeacherModal(false);
  };

  const handleHallSubmit = async (e) => {
    e.preventDefault();

    if (!newHall.hall_id.trim() || !newHall.capacity) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const payload = {
        hall_id: newHall.hall_id,
        capacity: parseInt(newHall.capacity)
      };

      console.log('Creating hall with payload:', payload);

      const response = await fetch('https://invigilo-backend.onrender.com/api/halls/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newHallData = await response.json();
        console.log('Hall created successfully:', newHallData);
        
        // Refresh the halls list from API
        await fetchData();
        alert('Hall added successfully!');
      } else {
        const errorData = await response.text();
        console.error('API Error:', response.status, errorData);
        throw new Error(`Failed to create hall: ${response.status}`);
      }
    } catch (error) {
      console.error('Error creating hall:', error);
      alert('Failed to add hall. Please check the console for details.');
      
      // Don't add to local state if API exists - maintain data consistency
      return;
    }

    setNewHall({ hall_id: '', capacity: '' });
    setShowHallModal(false);
  };

  const handleAssignmentSubmit = (e) => {
    e.preventDefault();
    
    const exam = exams.find(e => e.id === assignmentForm.examId);
    const hall = examHalls.find(h => h.id === parseInt(assignmentForm.hallId));
    const teacher = teachers.find(t => t.id === parseInt(assignmentForm.teacherId));

    if (!exam || !hall || !teacher) {
      alert('Please select all required fields');
      return;
    }

    const newAssignment = {
      id: Date.now(),
      examId: assignmentForm.examId,
      examTitle: exam.title,
      examDate: exam.start,
      examTime: exam.startTime || 'No time set',
      hallId: hall.id,
      hallName: hall.hall_id,
      teacherId: teacher.id,
      teacherName: teacher.user?.first_name || teacher.user?.username || 'Unnamed Teacher',
      dutyType: 'Invigilator',
      status: 'Assigned'
    };

    const updatedAssignments = [...assignments, newAssignment];
    saveAssignments(updatedAssignments);

    setAssignmentForm({ examId: '', hallId: '', teacherId: '' });
    setShowAssignmentModal(false);
    alert('Assignment created successfully!');
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      examId: assignment.examId,
      hallId: assignment.hallId.toString(),
      teacherId: assignment.teacherId.toString()
    });
    setShowEditModal(true);
  };

  const handleUpdateAssignment = (e) => {
    e.preventDefault();
    
    const exam = exams.find(e => e.id === assignmentForm.examId) || 
                 assignments.find(a => a.examId === assignmentForm.examId);
    const hall = examHalls.find(h => h.id === parseInt(assignmentForm.hallId));
    const teacher = teachers.find(t => t.id === parseInt(assignmentForm.teacherId));

    if (!hall || !teacher) {
      alert('Please select all required fields');
      return;
    }

    const updatedAssignment = {
      ...editingAssignment,
      examId: assignmentForm.examId,
      examTitle: exam?.title || editingAssignment.examTitle,
      examDate: exam?.start || editingAssignment.examDate,
      examTime: exam?.startTime || editingAssignment.examTime,
      hallId: hall.id,
      hallName: hall.hall_id,
      teacherId: teacher.id,
      teacherName: teacher.user?.first_name || teacher.user?.username || 'Unnamed Teacher'
    };

    const updatedAssignments = assignments.map(a => 
      a.id === editingAssignment.id ? updatedAssignment : a
    );
    saveAssignments(updatedAssignments);

    setAssignmentForm({ examId: '', hallId: '', teacherId: '' });
    setShowEditModal(false);
    setEditingAssignment(null);
    alert('Assignment updated successfully!');
  };

  const autoAssignTeachers = () => {
    const unassignedExams = getUnassignedExams();
    
    if (unassignedExams.length === 0) {
      alert('No unassigned exams found!');
      return;
    }

    if (teachers.length === 0) {
      alert('No teachers available for assignment!');
      return;
    }

    if (examHalls.length === 0) {
      alert('No exam halls available for assignment!');
      return;
    }

    const confirmed = window.confirm(
      `Auto-assign ${unassignedExams.length} unassigned exams to available teachers and halls?\n\nThis will:\n• Distribute exams evenly among teachers\n• Assign halls based on capacity\n• Avoid time conflicts`
    );

    if (!confirmed) return;

    const newAssignments = [];
    const teacherWorkload = {}; // Track assignments per teacher
    const hallBookings = {}; // Track hall usage by date/time

    // Initialize teacher workload tracking
    teachers.forEach(teacher => {
      teacherWorkload[teacher.id] = assignments.filter(a => a.teacherId === teacher.id).length;
    });

    // Initialize hall booking tracking
    assignments.forEach(assignment => {
      const key = `${assignment.hallId}-${assignment.examDate}`;
      if (!hallBookings[key]) hallBookings[key] = [];
      hallBookings[key].push(assignment.examTime);
    });

    unassignedExams.forEach((exam, index) => {
      // Find teacher with least assignments
      const availableTeacher = teachers.reduce((prev, current) => {
        return teacherWorkload[prev.id] <= teacherWorkload[current.id] ? prev : current;
      });

      // Find best hall (largest capacity available for this date/time)
      const examKey = `${exam.start}`;
      const availableHalls = examHalls.filter(hall => {
        const bookingKey = `${hall.id}-${exam.start}`;
        const hallTimes = hallBookings[bookingKey] || [];
        return !hallTimes.includes(exam.startTime || 'No time set');
      });

      const selectedHall = availableHalls.length > 0 
        ? availableHalls.reduce((prev, current) => 
            prev.capacity >= current.capacity ? prev : current
          )
        : examHalls[index % examHalls.length]; // Fallback to round-robin

      const newAssignment = {
        id: Date.now() + index,
        examId: exam.id,
        examTitle: exam.title,
        examDate: exam.start,
        examTime: exam.startTime || 'No time set',
        hallId: selectedHall.id,
        hallName: selectedHall.hall_id,
        teacherId: availableTeacher.id,
        teacherName: availableTeacher.user?.first_name || availableTeacher.user?.username || 'Unnamed Teacher',
        dutyType: 'Invigilator',
        status: 'Auto-Assigned'
      };

      newAssignments.push(newAssignment);

      // Update tracking
      teacherWorkload[availableTeacher.id]++;
      const bookingKey = `${selectedHall.id}-${exam.start}`;
      if (!hallBookings[bookingKey]) hallBookings[bookingKey] = [];
      hallBookings[bookingKey].push(exam.startTime || 'No time set');
    });

    const allAssignments = [...assignments, ...newAssignments];
    saveAssignments(allAssignments);

    alert(`✅ Auto-assignment completed!\n\n📊 Summary:\n• ${newAssignments.length} exams assigned\n• ${teachers.length} teachers utilized\n• ${examHalls.length} halls available\n\nCheck the Assignments tab to review and modify if needed.`);
  };

  const handleSwapTeachers = () => {
    if (!swapForm.teacher1Id || !swapForm.teacher2Id) {
      alert('Please select both teachers to swap');
      return;
    }

    if (swapForm.teacher1Id === swapForm.teacher2Id) {
      alert('Please select different teachers');
      return;
    }

    const teacher1Assignments = assignments.filter(a => a.teacherId === parseInt(swapForm.teacher1Id));
    const teacher2Assignments = assignments.filter(a => a.teacherId === parseInt(swapForm.teacher2Id));

    if (teacher1Assignments.length === 0 && teacher2Assignments.length === 0) {
      alert('Neither teacher has any assignments to swap');
      return;
    }

    const teacher1 = teachers.find(t => t.id === parseInt(swapForm.teacher1Id));
    const teacher2 = teachers.find(t => t.id === parseInt(swapForm.teacher2Id));

    const confirmed = window.confirm(
      `Swap assignments between:\n\n` +
      `${teacher1?.user?.first_name || 'Teacher 1'}: ${teacher1Assignments.length} assignments\n` +
      `${teacher2?.user?.first_name || 'Teacher 2'}: ${teacher2Assignments.length} assignments\n\n` +
      `This will exchange all their assignments. Continue?`
    );

    if (!confirmed) return;

    const updatedAssignments = assignments.map(assignment => {
      if (assignment.teacherId === parseInt(swapForm.teacher1Id)) {
        return {
          ...assignment,
          teacherId: parseInt(swapForm.teacher2Id),
          teacherName: teacher2?.user?.first_name || teacher2?.user?.username || 'Unnamed Teacher',
          status: 'Swapped'
        };
      } else if (assignment.teacherId === parseInt(swapForm.teacher2Id)) {
        return {
          ...assignment,
          teacherId: parseInt(swapForm.teacher1Id),
          teacherName: teacher1?.user?.first_name || teacher1?.user?.username || 'Unnamed Teacher',
          status: 'Swapped'
        };
      }
      return assignment;
    });

    saveAssignments(updatedAssignments);
    setSwapForm({ teacher1Id: '', teacher2Id: '' });
    setShowSwapModal(false);
    alert('Teachers swapped successfully!');
  };

  const handleRequestAction = (requestId, action) => {
    const updatedRequests = teacherRequests.map(request => 
      request.id === requestId 
        ? { ...request, status: action, reviewedAt: new Date().toISOString() }
        : request
    );
    setTeacherRequests(updatedRequests);
    localStorage.setItem('adminChangeRequests', JSON.stringify(updatedRequests));
    alert(`Request ${action.toLowerCase()} successfully!`);
  };

  const getTeacherAvailabilityForDate = (teacherId, date) => {
    const availability = teacherAvailability[teacherId];
    if (!availability) return null;
    return availability[date];
  };

  const removeAssignment = (assignmentId) => {
    if (window.confirm('Are you sure you want to remove this assignment?')) {
      const updatedAssignments = assignments.filter(a => a.id !== assignmentId);
      saveAssignments(updatedAssignments);
    }
  };

  const getUnassignedExams = () => {
    return exams.filter(exam => 
      !assignments.some(assignment => assignment.examId === exam.id)
    );
  };

  const getAssignmentStats = () => {
    return {
      totalExams: exams.length,
      assignedExams: assignments.length,
      unassignedExams: exams.length - assignments.length,
      totalTeachers: teachers.length,
      totalHalls: examHalls.length
    };
  };

  const stats = getAssignmentStats();

  if (loading) {
    return (
      <div style={styles.loading}>
        <div>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.backgroundOverlay}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.subtitle}>Manage Teachers, Exam Halls & Assignments</p>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsContainer}>
          <StatCard 
            icon={<Calendar size={24} />} 
            title="Total Exams" 
            value={stats.totalExams}
            color="#4299e1"
          />
          <StatCard 
            icon={<CheckCircle size={24} />} 
            title="Assigned" 
            value={stats.assignedExams}
            color="#48bb78"
          />
          <StatCard 
            icon={<AlertTriangle size={24} />} 
            title="Unassigned" 
            value={stats.unassignedExams}
            color="#ed8936"
          />
          <StatCard 
            icon={<Users size={24} />} 
            title="Teachers" 
            value={stats.totalTeachers}
            color="#9f7aea"
          />
          <StatCard 
            icon={<MapPin size={24} />} 
            title="Halls" 
            value={stats.totalHalls}
            color="#38b2ac"
          />
        </div>

        {/* Navigation Tabs */}
        <div style={styles.tabs}>
          {['overview', 'assignments', 'teachers', 'halls', 'requests'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tabButton,
                ...(activeTab === tab ? styles.activeTab : {})
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={styles.content}>
          {activeTab === 'overview' && (
            <div>
              <div style={styles.actionButtons}>
                <button onClick={() => setShowAssignmentModal(true)} style={styles.primaryButton}>
                  📋 Create Assignment
                </button>
                <button onClick={autoAssignTeachers} style={styles.autoButton}>
                  🤖 Auto-Assign All
                </button>
                <button onClick={() => setShowTeacherModal(true)} style={styles.button}>
                  👨‍🏫 Add Teacher
                </button>
                <button onClick={() => setShowHallModal(true)} style={styles.button}>
                  🏢 Add Hall
                </button>
              </div>

              <div style={styles.grid}>
                <Card
                  title="📚 Recent Exams"
                  data={exams.slice(0, 5)}
                  renderItem={(exam) => (
                    <div style={styles.examItem}>
                      <div>
                        <strong style={styles.examTitle}>{exam.title}</strong>
                        <p style={styles.date}>{new Date(exam.start).toLocaleDateString()}</p>
                      </div>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: assignments.some(a => a.examId === exam.id) ? '#48bb78' : '#ed8936'
                      }}>
                        {assignments.some(a => a.examId === exam.id) ? 'Assigned' : 'Pending'}
                      </span>
                    </div>
                  )}
                />

                <Card
                  title="⚠️ Unassigned Exams"
                  data={getUnassignedExams()}
                  renderItem={(exam) => (
                    <div style={styles.examItem}>
                      <div>
                        <strong style={styles.examTitle}>{exam.title}</strong>
                        <p style={styles.date}>{new Date(exam.start).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => {
                          setAssignmentForm({ ...assignmentForm, examId: exam.id });
                          setShowAssignmentModal(true);
                        }}
                        style={styles.assignButton}
                      >
                        Assign
                      </button>
                    </div>
                  )}
                />
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div>
              <div style={styles.actionButtons}>
                <button onClick={() => setShowAssignmentModal(true)} style={styles.primaryButton}>
                  📋 Create New Assignment
                </button>
                <button onClick={autoAssignTeachers} style={styles.autoButton}>
                  🤖 Auto-Assign Remaining
                </button>
                <button onClick={() => setShowSwapModal(true)} style={styles.swapButton}>
                  🔄 Swap Teachers
                </button>
              </div>
              
              <Card
                title="📋 Current Assignments"
                data={assignments}
                renderItem={(assignment) => (
                  <div style={styles.assignmentItem}>
                    <div style={styles.assignmentDetails}>
                      <h4 style={styles.assignmentTitle}>{assignment.examTitle}</h4>
                      <div style={styles.assignmentInfo}>
                        <span style={styles.assignmentInfoItem}>📅 {new Date(assignment.examDate).toLocaleDateString()}</span>
                        <span style={styles.assignmentInfoItem}>⏰ {assignment.examTime}</span>
                        <span style={styles.assignmentInfoItem}>🏢 {assignment.hallName}</span>
                        <span style={styles.assignmentInfoItem}>👨‍🏫 {assignment.teacherName} (Invigilator)</span>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: assignment.status === 'Auto-Assigned' ? '#9f7aea' : '#48bb78',
                          fontSize: '0.7rem',
                          padding: '2px 8px'
                        }}>
                          {assignment.status}
                        </span>
                      </div>
                    </div>
                    <div style={styles.assignmentActions}>
                      <button
                        onClick={() => handleEditAssignment(assignment)}
                        style={styles.editButton}
                        title="Edit Assignment"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => removeAssignment(assignment.id)}
                        style={styles.removeButton}
                        title="Delete Assignment"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              />
            </div>
          )}

          {activeTab === 'teachers' && (
            <div>
              <div style={styles.actionButtons}>
                <button onClick={() => setShowTeacherModal(true)} style={styles.primaryButton}>
                  👨‍🏫 Add Teacher
                </button>
              </div>
              
              <Card
                title="👨‍🏫 Teachers"
                data={teachers}
                renderItem={(teacher) => (
                  <div style={styles.teacherItem}>
                    <div style={styles.teacherInfo}>
                      <div style={styles.avatar}>
                        <User size={20} />
                      </div>
                      <div>
                        <strong style={styles.teacherName}>{teacher.user?.first_name || teacher.user?.username || 'Unnamed'}</strong>
                        <p style={styles.subject}>{teacher.subject}</p>
                        {teacher.user?.email && (
                          <p style={styles.email}>{teacher.user.email}</p>
                        )}
                      </div>
                    </div>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: assignments.some(a => a.teacherId === teacher.id) ? '#48bb78' : '#ffffff66',
                      color: assignments.some(a => a.teacherId === teacher.id) ? 'white' : '#fff'
                    }}>
                      {assignments.filter(a => a.teacherId === teacher.id).length} assignments
                    </span>
                  </div>
                )}
              />
            </div>
          )}

          {activeTab === 'halls' && (
            <div>
              <div style={styles.actionButtons}>
                <button onClick={() => setShowHallModal(true)} style={styles.primaryButton}>
                  🏢 Add Hall
                </button>
              </div>
              
              <Card
                title="🏢 Exam Halls"
                data={examHalls}
                renderItem={(hall) => (
                  <div style={styles.hallItem}>
                    <div>
                      <strong style={styles.hallName}>Hall {hall.hall_id}</strong>
                      <p style={styles.capacity}>Capacity: {hall.capacity} students</p>
                    </div>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: assignments.some(a => a.hallId === hall.id) ? '#48bb78' : '#ffffff66',
                      color: assignments.some(a => a.hallId === hall.id) ? 'white' : '#fff'
                    }}>
                      {assignments.filter(a => a.hallId === hall.id).length} bookings
                    </span>
                  </div>
                )}
              />
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <div style={styles.actionButtons}>
                <button onClick={() => setShowSwapModal(true)} style={styles.primaryButton}>
                  🔄 Swap Teachers
                </button>
              </div>

              <div style={styles.grid}>
                <Card
                  title="📝 Teacher Change Requests"
                  data={teacherRequests.filter(r => r.status === 'Pending')}
                  renderItem={(request) => (
                    <div style={styles.requestItem}>
                      <div style={styles.requestDetails}>
                        <h4 style={styles.requestTitle}>{request.examTitle}</h4>
                        <p style={styles.requestInfo}>
                          <strong>Teacher:</strong> {request.teacherName}<br/>
                          <strong>Current:</strong> {request.currentHall}<br/>
                          <strong>Requested:</strong> {request.requestedHall}<br/>
                          <strong>Reason:</strong> {request.reason}
                        </p>
                        <small style={styles.requestDate}>
                          Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                        </small>
                      </div>
                      <div style={styles.requestActions}>
                        <button
                          onClick={() => handleRequestAction(request.id, 'Approved')}
                          style={styles.approveButton}
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleRequestAction(request.id, 'Rejected')}
                          style={styles.rejectButton}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  )}
                />

                <Card
                  title="📊 Teacher Availability Overview"
                  data={teachers}
                  renderItem={(teacher) => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isAvailableToday = getTeacherAvailabilityForDate(teacher.id, todayStr);
                    const assignmentCount = assignments.filter(a => a.teacherId === teacher.id).length;
                    
                    return (
                      <div style={styles.availabilityItem}>
                        <div style={styles.teacherDetails}>
                          <strong style={styles.teacherName}>
                            {teacher.user?.first_name || teacher.user?.username || 'Unnamed'}
                          </strong>
                          <p style={styles.subject}>{teacher.subject}</p>
                          <p style={styles.assignmentCount}>{assignmentCount} assignments</p>
                        </div>
                        <div style={styles.availabilityStatus}>
                          <span style={{
                            ...styles.availabilityBadge,
                            backgroundColor: 
                              isAvailableToday === true ? '#48bb78' :
                              isAvailableToday === false ? '#e53e3e' : '#a0aec0',
                            color: 'white'
                          }}>
                            {isAvailableToday === true ? '✅ Available Today' :
                             isAvailableToday === false ? '❌ Unavailable Today' : '? No Status Set'}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>

              <Card
                title="📈 Recent Request History"
                data={teacherRequests.filter(r => r.status !== 'Pending').slice(0, 5)}
                renderItem={(request) => (
                  <div style={styles.historyItem}>
                    <div>
                      <strong>{request.examTitle}</strong> - {request.teacherName}
                      <p style={styles.historyDetails}>
                        {request.currentHall} → {request.requestedHall}
                      </p>
                    </div>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: request.status === 'Approved' ? '#48bb78' : '#e53e3e'
                    }}>
                      {request.status}
                    </span>
                  </div>
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showTeacherModal && (
        <Modal
          title="Add Teacher"
          onClose={() => setShowTeacherModal(false)}
          onSubmit={handleTeacherSubmit}
          fields={[
            {
              placeholder: 'Teacher Name',
              value: newTeacher.username,
              onChange: e => setNewTeacher(prev => ({ ...prev, username: e.target.value }))
            },
            {
              placeholder: 'Subject',
              value: newTeacher.subject,
              onChange: e => setNewTeacher(prev => ({ ...prev, subject: e.target.value }))
            }
          ]}
        />
      )}

      {showHallModal && (
        <Modal
          title="Add Exam Hall"
          onClose={() => setShowHallModal(false)}
          onSubmit={handleHallSubmit}
          fields={[
            {
              placeholder: 'Hall ID (e.g., A-101)',
              value: newHall.hall_id,
              onChange: e => setNewHall({ ...newHall, hall_id: e.target.value })
            },
            {
              placeholder: 'Capacity',
              type: 'number',
              value: newHall.capacity,
              onChange: e => setNewHall({ ...newHall, capacity: e.target.value })
            }
          ]}
        />
      )}

      {showAssignmentModal && (
        <AssignmentModal
          exams={getUnassignedExams()}
          halls={examHalls}
          teachers={teachers}
          formData={assignmentForm}
          onChange={setAssignmentForm}
          onSubmit={handleAssignmentSubmit}
          onClose={() => setShowAssignmentModal(false)}
        />
      )}

      {showEditModal && editingAssignment && (
        <EditAssignmentModal
          assignment={editingAssignment}
          exams={exams}
          halls={examHalls}
          teachers={teachers}
          formData={assignmentForm}
          onChange={setAssignmentForm}
          onSubmit={handleUpdateAssignment}
          onClose={() => {
            setShowEditModal(false);
            setEditingAssignment(null);
            setAssignmentForm({ examId: '', hallId: '', teacherId: '' });
          }}
        />
      )}

      {showSwapModal && (
        <SwapTeachersModal
          teachers={teachers}
          assignments={assignments}
          formData={swapForm}
          onChange={setSwapForm}
          onSubmit={handleSwapTeachers}
          onClose={() => setShowSwapModal(false)}
        />
      )}
    </div>
  );
}

// Helper Components
function StatCard({ icon, title, value, color }) {
  return (
    <div style={{ ...styles.statCard, borderLeft: `4px solid ${color}` }}>
      <div style={{ ...styles.icon, color }}>{icon}</div>
      <div>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statTitle}>{title}</div>
      </div>
    </div>
  );
}

function Card({ title, data, renderItem }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>{title}</h3>
      <div style={styles.cardContent}>
        {data.length === 0 ? (
          <p style={styles.emptyState}>No data available</p>
        ) : (
          data.map((item, i) => (
            <div key={i} style={styles.cardItem}>
              {renderItem(item)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Modal({ title, onClose, onSubmit, fields }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>{title}</h3>
        <form onSubmit={onSubmit}>
          {fields.map((field, idx) => (
            <input
              key={idx}
              type={field.type || 'text'}
              placeholder={field.placeholder}
              value={field.value}
              onChange={field.onChange}
              required
              style={styles.input}
            />
          ))}
          <div style={styles.modalActions}>
            <button type="submit" style={styles.submitButton}>Submit</button>
            <button type="button" onClick={onClose} style={styles.cancelButton}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignmentModal({ exams, halls, teachers, formData, onChange, onSubmit, onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>Create Assignment</h3>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>
          Assign a teacher as invigilator for an exam in a specific hall
        </p>
        <form onSubmit={onSubmit}>
          <select
            value={formData.examId}
            onChange={(e) => onChange({ ...formData, examId: e.target.value })}
            required
            style={styles.select}
          >
            <option value="">Select Exam</option>
            {exams.length === 0 ? (
              <option value="" disabled>No unassigned exams available</option>
            ) : (
              exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} - {new Date(exam.start).toLocaleDateString()} at {exam.startTime || 'No time set'}
                </option>
              ))
            )}
          </select>

          {exams.length === 0 && (
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>
              No unassigned exams found. Create exams in the Schedule page first, or all exams may already be assigned.
            </p>
          )}

          <select
            value={formData.hallId}
            onChange={(e) => onChange({ ...formData, hallId: e.target.value })}
            required
            style={styles.select}
          >
            <option value="">Select Exam Hall</option>
            {halls.map((hall) => (
              <option key={hall.id} value={hall.id}>
                {hall.hall_id} (Capacity: {hall.capacity})
              </option>
            ))}
          </select>

          <select
            value={formData.teacherId}
            onChange={(e) => onChange({ ...formData, teacherId: e.target.value })}
            required
            style={styles.select}
          >
            <option value="">Select Teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.user?.first_name || teacher.user?.username || 'Unnamed Teacher'} - {teacher.subject}
              </option>
            ))}
          </select>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={!formData.examId || !formData.hallId || !formData.teacherId}
            >
              Create Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditAssignmentModal({ assignment, exams, halls, teachers, formData, onChange, onSubmit, onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>Edit Assignment</h3>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>
          Modify the assignment for: <strong>{assignment.examTitle}</strong>
        </p>
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <strong>Current Assignment:</strong><br/>
            Exam: {assignment.examTitle}<br/>
            Date: {new Date(assignment.examDate).toLocaleDateString()}<br/>
            Time: {assignment.examTime}
          </div>

          <select
            value={formData.hallId}
            onChange={(e) => onChange({ ...formData, hallId: e.target.value })}
            required
            style={styles.select}
          >
            <option value="">Select Exam Hall</option>
            {halls.map((hall) => (
              <option key={hall.id} value={hall.id}>
                {hall.hall_id} (Capacity: {hall.capacity})
              </option>
            ))}
          </select>

          <select
            value={formData.teacherId}
            onChange={(e) => onChange({ ...formData, teacherId: e.target.value })}
            required
            style={styles.select}
          >
            <option value="">Select Teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.user?.first_name || teacher.user?.username || 'Unnamed Teacher'} - {teacher.subject}
              </option>
            ))}
          </select>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={!formData.hallId || !formData.teacherId}
            >
              Update Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SwapTeachersModal({ teachers, assignments, formData, onChange, onSubmit, onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>Swap Teacher Assignments</h3>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>
          Exchange all assignments between two teachers
        </p>
        <form onSubmit={onSubmit}>
          <label style={styles.label}>First Teacher:</label>
          <select
            value={formData.teacher1Id || ''}
            onChange={(e) => onChange({ ...formData, teacher1Id: e.target.value })}
            required
            style={styles.select}
          >
            <option value="">Select First Teacher</option>
            {teachers.map((teacher) => {
              const assignmentCount = assignments.filter(a => a.teacherId === teacher.id).length;
              return (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user?.first_name || teacher.user?.username || 'Unnamed Teacher'} 
                  ({assignmentCount} assignments)
                </option>
              );
            })}
          </select>

          <label style={styles.label}>Second Teacher:</label>
          <select
            value={formData.teacher2Id || ''}
            onChange={(e) => onChange({ ...formData, teacher2Id: e.target.value })}
            required
            style={styles.select}
          >
            <option value="">Select Second Teacher</option>
            {teachers.map((teacher) => {
              const assignmentCount = assignments.filter(a => a.teacherId === teacher.id).length;
              return (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user?.first_name || teacher.user?.username || 'Unnamed Teacher'} 
                  ({assignmentCount} assignments)
                </option>
              );
            })}
          </select>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={!formData.teacher1Id || !formData.teacher2Id || formData.teacher1Id === formData.teacher2Id}
            >
              Swap Assignments
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Complete Styles Object
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    position: 'relative',
  },
  backgroundOverlay: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    padding: '20px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.2rem',
    color: '#666',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    color: 'white',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  subtitle: {
    fontSize: '1.2rem',
    opacity: 0.9,
    margin: 0,
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
  },
  icon: {
    marginRight: '15px',
    opacity: 0.8,
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 1,
  },
  statTitle: {
    fontSize: '0.9rem',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tabs: {
    display: 'flex',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '30px',
    backdropFilter: 'blur(10px)',
  },
  tabButton: {
    flex: 1,
    padding: '12px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'white',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.3s',
    fontSize: '1rem',
    fontWeight: '500',
  },
  activeTab: {
    backgroundColor: 'white',
    color: '#667eea',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(20px)',
  },
  actionButtons: {
    display: 'flex',
    gap: '15px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  },
  autoButton: {
    backgroundColor: '#48bb78',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: '0 4px 15px rgba(72, 187, 120, 0.4)',
  },
  swapButton: {
    backgroundColor: '#ed8936',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: '0 4px 15px rgba(237, 137, 54, 0.4)',
  },
  button: {
    backgroundColor: '#e2e8f0',
    color: '#4a5568',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  },
  cardTitle: {
    backgroundColor: '#667eea',
    color: 'white',
    margin: 0,
    padding: '20px',
    fontSize: '1.3rem',
    fontWeight: '600',
  },
  cardContent: {
    padding: '20px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  cardItem: {
    padding: '15px 0',
    borderBottom: '1px solid #e2e8f0',
  },
  emptyState: {
    textAlign: 'center',
    color: '#a0aec0',
    fontStyle: 'italic',
    padding: '40px 20px',
  },
  examItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examTitle: {
    color: '#2d3748',
    fontSize: '1.1rem',
  },
  date: {
    color: '#718096',
    fontSize: '0.9rem',
    margin: '5px 0 0 0',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'white',
  },
  assignButton: {
    backgroundColor: '#48bb78',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  assignmentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    marginBottom: '15px',
  },
  assignmentDetails: {
    flex: 1,
  },
  assignmentTitle: {
    color: '#2d3748',
    fontSize: '1.2rem',
    margin: '0 0 10px 0',
  },
  assignmentInfo: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    alignItems: 'center',
  },
  assignmentInfoItem: {
    fontSize: '0.9rem',
    color: '#4a5568',
    backgroundColor: '#f7fafc',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  assignmentActions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    backgroundColor: '#4299e1',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  removeButton: {
    backgroundColor: '#e53e3e',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  teacherItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    marginBottom: '10px',
  },
  teacherInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#4a5568',
  },
  teacherName: {
    color: '#2d3748',
    fontSize: '1.1rem',
    margin: '0 0 5px 0',
  },
  subject: {
    color: '#718096',
    fontSize: '0.9rem',
    margin: '0 0 5px 0',
  },
  email: {
    color: '#a0aec0',
    fontSize: '0.8rem',
    margin: 0,
  },
  hallItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    marginBottom: '10px',
  },
  hallName: {
    color: '#2d3748',
    fontSize: '1.1rem',
    margin: '0 0 5px 0',
  },
  capacity: {
    color: '#718096',
    fontSize: '0.9rem',
    margin: 0,
  },
  requestItem: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    marginBottom: '15px',
  },
  requestDetails: {
    marginBottom: '15px',
  },
  requestTitle: {
    color: '#2d3748',
    fontSize: '1.1rem',
    margin: '0 0 10px 0',
  },
  requestInfo: {
    color: '#4a5568',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    margin: '0 0 10px 0',
  },
  requestDate: {
    color: '#a0aec0',
    fontSize: '0.8rem',
  },
  requestActions: {
    display: 'flex',
    gap: '10px',
  },
  approveButton: {
    backgroundColor: '#48bb78',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  rejectButton: {
    backgroundColor: '#e53e3e',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  availabilityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    marginBottom: '10px',
  },
  teacherDetails: {
    flex: 1,
  },
  assignmentCount: {
    color: '#a0aec0',
    fontSize: '0.8rem',
    margin: 0,
  },
  availabilityStatus: {
    textAlign: 'right',
  },
  availabilityBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    marginBottom: '10px',
  },
  historyDetails: {
    color: '#718096',
    fontSize: '0.9rem',
    margin: '5px 0 0 0',
  },
  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    position: 'relative',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitle: {
    margin: '0 0 20px 0',
    fontSize: '1.8rem',
    color: '#2d3748',
    fontWeight: '600',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    marginBottom: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    marginBottom: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#4a5568',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
  },
  submitButton: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
    color: '#4a5568',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s',
  },
};

// Export as default
export default HeroSection;