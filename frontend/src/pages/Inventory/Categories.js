import React, { useState, useEffect } from "react";
import MainLayout from "../../layouts/MainLayout";

function Categories() {
  const [categories, setCategories] = useState([
    { id: 1, name: "Raw Materials", code: "RAW", count: 12 },
    { id: 2, name: "Finished Goods", code: "FIN", count: 24 },
    { id: 3, name: "Spare Parts", code: "SPR", count: 8 },
    { id: 4, name: "Packaging", code: "PKG", count: 15 }
  ]);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName || !newCode) return;
    setCategories([
      ...categories,
      { id: categories.length + 1, name: newName, code: newCode.toUpperCase(), count: 0 }
    ]);
    setNewName("");
    setNewCode("");
    alert("Category created successfully!");
  };

  return (
    <MainLayout>
      <div className="container-fluid py-4">
        <h4 className="font-bold text-primary mb-4">Category Master</h4>

        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card border-0 p-4 shadow-sm" style={{ borderRadius: "14px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
              <h5 className="font-bold text-dark mb-3">Create Category</h5>
              <form onSubmit={handleAdd} className="row g-3">
                <div className="col-12">
                  <label className="form-label small font-semibold">Category Name</label>
                  <input
                    type="text"
                    className="form-control text-secondary small"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Electrical Components"
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small font-semibold">Category Code</label>
                  <input
                    type="text"
                    className="form-control text-secondary small"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. ELEC"
                    required
                  />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary w-100 font-bold py-2">
                    Add Category Master
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card border-0 p-4 shadow-sm" style={{ borderRadius: "14px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
              <h5 className="font-bold text-dark mb-3">Categories & Assignments</h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle text-secondary small">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Category Code</th>
                      <th>Category Name</th>
                      <th>Assigned Products</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td className="font-bold">{c.code}</td>
                        <td className="font-semibold text-dark">{c.name}</td>
                        <td>
                          <span className="badge bg-light text-secondary">{c.count} items</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Categories;
