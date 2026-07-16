import React from "react";
import MainLayout from "../../layouts/MainLayout";

function HolidayCalendar() {
  const holidays = [
    { date: "2026-01-01", name: "New Year's Day", type: "National Holiday" },
    { date: "2026-01-26", name: "Republic Day", type: "National Gazetted Holiday" },
    { date: "2026-04-14", name: "Dr. B.R. Ambedkar Jayanti", type: "Gazetted Holiday" },
    { date: "2026-05-01", name: "May Day / Labor Day", type: "Corporate Holiday" },
    { date: "2026-08-15", name: "Independence Day", type: "National Gazetted Holiday" },
    { date: "2026-10-02", name: "Gandhi Jayanti", type: "National Gazetted Holiday" },
    { date: "2026-12-25", name: "Christmas Day", type: "Gazetted Holiday" }
  ];

  return (
    <MainLayout>
      <div className="container-fluid py-4">
        <h4 className="font-bold text-primary mb-4">Holiday Calendar</h4>

        <div className="card border-0 p-4 shadow-sm" style={{ borderRadius: "14px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          <h5 className="font-bold text-dark mb-3">Company Roster & Calendar</h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle text-secondary small">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Holiday Name</th>
                  <th>Holiday Category</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map((h, i) => (
                  <tr key={i}>
                    <td>{h.date}</td>
                    <td className="font-semibold text-dark">{h.name}</td>
                    <td>
                      <span className="badge bg-success-soft text-success">{h.type}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default HolidayCalendar;
