import React from "react";
import { Link } from "react-router-dom";
import {
  FaUserCircle,
  FaChalkboardTeacher,
  FaHome,
  FaSchool,
  FaCalendarAlt
} from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">Invigilo</div>

        <ul className="navbar-menu">
          <li>
            <Link to="/dashboard">
              <FaHome /> <span>Dashboard</span>
            </Link>
          </li>
        
          <li>
            <Link to="#">
              <FaSchool /> <span>Exam Halls</span>
            </Link>
          </li>
          <li>
            <Link to="#">
              <FaCalendarAlt /> <span>Schedule</span>
            </Link>
          </li>
        </ul>

        <div className="navbar-profile">
          <Link to="/auth" className="profile-link">
            <FaUserCircle size={22} />
            <span>teacher</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

