import React, { useMemo, useState } from "react";
import DoctorLayout from "../components/layout/DoctorLayout";
import "../styles/DoctorAppointments.css";

const initialAppointments = [
  {
    id: 1,
    patientName: "Ahmed Ali",
    type: "Follow-up",
    date: "2025-11-21",
    time: "16:30",
    status: "upcoming",
    createdAt: "2025-11-10",
    notes: "Knee pain improving, check ROM and strength.",
  },
  {
    id: 2,
    patientName: "Sara Almutairi",
    type: "Initial Assessment",
    date: "2025-11-19",
    time: "14:00",
    status: "completed",
    createdAt: "2025-11-05",
    notes: "ACL injury, start phase-1 rehab protocol.",
  },
  {
    id: 3,
    patientName: "Fahad Alotaibi",
    type: "Rehab Session",
    date: "2025-11-18",
    time: "11:15",
    status: "cancelled",
    createdAt: "2025-11-06",
    notes: "Patient cancelled due to travel.",
  },
  {
    id: 4,
    patientName: "Lama Khaled",
    type: "Follow-up",
    date: "2025-11-22",
    time: "09:45",
    status: "upcoming",
    createdAt: "2025-11-15",
    notes: "Patella tracking issue, review exercises.",
  },
  {
    id: 5,
    patientName: "Mohammed Aziz",
    type: "Rehab Session",
    date: "2025-11-20",
    time: "18:10",
    status: "upcoming",
    createdAt: "2025-11-13",
    notes: "Strength training progression.",
  },
  {
    id: 6,
    patientName: "Noura Saad",
    type: "Check-up",
    date: "2025-11-17",
    time: "13:00",
    status: "completed",
    createdAt: "2025-11-03",
    notes: "Good progress, reduce visit frequency.",
  },
  {
    id: 7,
    patientName: "Khalid Salman",
    type: "Initial Assessment",
    date: "2025-11-25",
    time: "12:30",
    status: "upcoming",
    createdAt: "2025-11-16",
    notes: "Post-op knee surgery, build baseline.",
  },
];

const PAGE_SIZE = 6;

const Appointments = () => {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [newAppointment, setNewAppointment] = useState({
    patientName: "",
    type: "",
    date: "",
    time: "",
    status: "upcoming",
    notes: "",
  });

  // ==========================
  // FILTER + SEARCH
  // ==========================
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const matchSearch =
        appt.patientName.toLowerCase().includes(search.toLowerCase()) ||
        appt.type.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "all" ? true : appt.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [appointments, search, statusFilter]);

  // ==========================
  // SORTING
  // ==========================
  const sortedAppointments = useMemo(() => {
    const sorted = [...filteredAppointments];

    if (!sortConfig.key) return sorted;

    sorted.sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal = a[key];
      let bVal = b[key];

      // نص → lowercase
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredAppointments, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // قلب الاتجاه
        const newDirection = prev.direction === "asc" ? "desc" : "asc";
        return { key, direction: newDirection };
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  // ==========================
  // PAGINATION
  // ==========================
  const totalPages = Math.ceil(sortedAppointments.length / PAGE_SIZE) || 1;

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return sortedAppointments.slice(start, end);
  }, [sortedAppointments, currentPage]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // ==========================
  // MODAL HANDLERS
  // ==========================
  const openDetails = (appt) => {
    setSelectedAppointment(appt);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setSelectedAppointment(null);
    setIsDetailsOpen(false);
  };

  const openNewModal = () => {
    setNewAppointment({
      patientName: "",
      type: "",
      date: "",
      time: "",
      status: "upcoming",
      notes: "",
    });
    setIsNewModalOpen(true);
  };

  const closeNewModal = () => {
    setIsNewModalOpen(false);
  };

  const handleNewChange = (e) => {
    setNewAppointment({
      ...newAppointment,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateAppointment = (e) => {
    e.preventDefault();

    const nextId =
      appointments.length > 0
        ? Math.max(...appointments.map((a) => a.id)) + 1
        : 1;

    const createdAt = new Date().toISOString().slice(0, 10);

    const newAppt = {
      id: nextId,
      ...newAppointment,
      createdAt,
    };

    setAppointments([newAppt, ...appointments]);
    setIsNewModalOpen(false);
    setCurrentPage(1);
  };

  // تغيير حالة الموعد (مثلاً من Upcoming → Completed / Cancelled)
  const updateStatus = (id, newStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  };

  return (
    <DoctorLayout active="appointments">
      <div className="appointments-page">
        {/* HEADER */}
        <div className="appointments-header">
          <div>
            <h1>Appointments</h1>
            <p className="sub-text">
              Manage upcoming, completed, and cancelled sessions.
            </p>
          </div>
          <button className="add-appointment-btn" onClick={openNewModal}>
            + New Appointment
          </button>
        </div>

        {/* FILTERS / CONTROLS */}
        <div className="appointments-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by patient or type..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="filters-right">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="appointments-table-wrapper">
          <table className="appointments-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("patientName")}>
                  <span>Patient</span>
                  <span className="sort-indicator">
                    {getSortIndicator("patientName")}
                  </span>
                </th>
                <th onClick={() => handleSort("type")}>
                  <span>Type</span>
                  <span className="sort-indicator">
                    {getSortIndicator("type")}
                  </span>
                </th>
                <th onClick={() => handleSort("date")}>
                  <span>Date</span>
                  <span className="sort-indicator">
                    {getSortIndicator("date")}
                  </span>
                </th>
                <th onClick={() => handleSort("time")}>
                  <span>Time</span>
                  <span className="sort-indicator">
                    {getSortIndicator("time")}
                  </span>
                </th>
                <th onClick={() => handleSort("status")}>
                  <span>Status</span>
                  <span className="sort-indicator">
                    {getSortIndicator("status")}
                  </span>
                </th>
                <th onClick={() => handleSort("createdAt")}>
                  <span>Created</span>
                  <span className="sort-indicator">
                    {getSortIndicator("createdAt")}
                  </span>
                </th>
                <th>
                  <span>Actions</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No appointments found. Try changing filters or search.
                  </td>
                </tr>
              )}

              {currentItems.map((appt) => (
                <tr key={appt.id}>
                  <td>{appt.patientName}</td>
                  <td>{appt.type}</td>
                  <td>{appt.date}</td>
                  <td>{appt.time}</td>
                  <td>
                    <span className={`status-badge ${appt.status}`}>
                      {appt.status.charAt(0).toUpperCase() +
                        appt.status.slice(1)}
                    </span>
                  </td>
                  <td>{appt.createdAt}</td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="row-action details"
                        onClick={() => openDetails(appt)}
                      >
                        Details
                      </button>

                      {appt.status !== "completed" && (
                        <button
                          className="row-action complete"
                          onClick={() => updateStatus(appt.id, "completed")}
                        >
                          Mark Done
                        </button>
                      )}

                      {appt.status !== "cancelled" && (
                        <button
                          className="row-action cancel"
                          onClick={() => updateStatus(appt.id, "cancelled")}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="appointments-pagination">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>

          <span>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>

        {/* DETAILS MODAL */}
        {isDetailsOpen && selectedAppointment && (
          <div className="appt-modal-backdrop" onClick={closeDetails}>
            <div
              className="appt-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Appointment Details</h2>
              <p>
                <strong>Patient:</strong> {selectedAppointment.patientName}
              </p>
              <p>
                <strong>Type:</strong> {selectedAppointment.type}
              </p>
              <p>
                <strong>Date:</strong> {selectedAppointment.date}
              </p>
              <p>
                <strong>Time:</strong> {selectedAppointment.time}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`status-badge ${selectedAppointment.status}`}
                >
                  {selectedAppointment.status}
                </span>
              </p>
              <p>
                <strong>Created:</strong> {selectedAppointment.createdAt}
              </p>
              <p className="modal-notes">
                <strong>Notes:</strong> {selectedAppointment.notes}
              </p>

              <div className="modal-actions">
                <button className="modal-close-btn" onClick={closeDetails}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NEW APPOINTMENT MODAL */}
        {isNewModalOpen && (
          <div className="appt-modal-backdrop" onClick={closeNewModal}>
            <div
              className="appt-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>New Appointment</h2>

              <form onSubmit={handleCreateAppointment} className="modal-form">
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Patient Name</label>
                    <input
                      type="text"
                      name="patientName"
                      value={newAppointment.patientName}
                      onChange={handleNewChange}
                      required
                    />
                  </div>

                  <div className="modal-form-group">
                    <label>Type</label>
                    <input
                      type="text"
                      name="type"
                      value={newAppointment.type}
                      onChange={handleNewChange}
                      placeholder="Follow-up, Rehab..."
                      required
                    />
                  </div>
                </div>

                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      value={newAppointment.date}
                      onChange={handleNewChange}
                      required
                    />
                  </div>

                  <div className="modal-form-group">
                    <label>Time</label>
                    <input
                      type="time"
                      name="time"
                      value={newAppointment.time}
                      onChange={handleNewChange}
                      required
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={newAppointment.status}
                    onChange={handleNewChange}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="modal-form-group">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={newAppointment.notes}
                    onChange={handleNewChange}
                    rows={3}
                  />
                </div>

                <div className="modal-actions spaced">
                  <button
                    type="button"
                    className="modal-close-btn secondary"
                    onClick={closeNewModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="modal-save-btn">
                    Create Appointment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
};

export default Appointments;
