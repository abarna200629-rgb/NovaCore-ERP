import { API_BASE_URL } from "../../config";
import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import axios from "axios";
import {
  FaBox, FaPlus, FaMinus, FaEdit, FaTrash, FaHistory, FaTimes,
  FaSearch, FaFilter, FaShoppingCart, FaDownload, FaPrint
} from "react-icons/fa";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);

  // Selections
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockHistoryList, setStockHistoryList] = useState([]);

  // Form fields for Add Product
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Hardware");
  const [supplier, setSupplier] = useState("Dell Inc.");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [gst, setGst] = useState("18.0");
  const [warehouse, setWarehouse] = useState("Warehouse A");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("5");
  const [expiryDate, setExpiryDate] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [sku, setSku] = useState("");

  // Form fields for Edit Product
  const [editProductId, setEditProductId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("Hardware");
  const [editSupplier, setEditSupplier] = useState("Dell Inc.");
  const [editPurchasePrice, setEditPurchasePrice] = useState("");
  const [editSellingPrice, setEditSellingPrice] = useState("");
  const [editGst, setEditGst] = useState("18.0");
  const [editWarehouse, setEditWarehouse] = useState("Warehouse A");
  const [editStock, setEditStock] = useState("");
  const [editMinStock, setEditMinStock] = useState("5");
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [editBatchNumber, setEditBatchNumber] = useState("");
  const [editSku, setEditSku] = useState("");

  // Stock In Form Fields
  const [stockInQty, setStockInQty] = useState("");
  const [stockInReason, setStockInReason] = useState("New Stock");
  const [stockInNotes, setStockInNotes] = useState("");

  // Stock Out Form Fields
  const [stockOutQty, setStockOutQty] = useState("");
  const [stockOutReason, setStockOutReason] = useState("Sale");
  const [stockOutNotes, setStockOutNotes] = useState("");

  // Purchase Order Request Fields
  const [poProdName, setPoProdName] = useState("");
  const [poQty, setPoQty] = useState("");
  const [poPrice, setPoPrice] = useState("");
  const [poRequester, setPoRequester] = useState("Inventory Manager");

  const API_URL = API_BASE_URL + "/api/inventory/products";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL, getConfig());
      setProducts(response.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name || !purchasePrice || !sellingPrice || !stock || !expiryDate || !batchNumber) {
      alert("Please fill in all required fields!");
      return;
    }

    const payload = {
      name,
      category,
      supplier,
      purchasePrice: parseFloat(purchasePrice),
      sellingPrice: parseFloat(sellingPrice),
      gst: parseFloat(gst),
      warehouse,
      stock: parseInt(stock),
      minStock: parseInt(minStock),
      expiryDate,
      batchNumber,
      sku: sku.trim() !== "" ? sku.trim() : null
    };

    try {
      await axios.post(API_URL, payload, getConfig());
      alert("Product Registered Successfully");
      setIsAddModalOpen(false);
      clearForm();
      loadProducts();
    } catch (error) {
      console.log(error);
      alert("Failed to register product");
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (!editName || !editPurchasePrice || !editSellingPrice || !editStock || !editExpiryDate || !editBatchNumber) {
      alert("Please fill in all required fields!");
      return;
    }

    const payload = {
      name: editName,
      category: editCategory,
      supplier: editSupplier,
      purchasePrice: parseFloat(editPurchasePrice),
      sellingPrice: parseFloat(editSellingPrice),
      gst: parseFloat(editGst),
      warehouse: editWarehouse,
      stock: parseInt(editStock),
      minStock: parseInt(editMinStock),
      expiryDate: editExpiryDate,
      batchNumber: editBatchNumber,
      sku: editSku.trim() !== "" ? editSku.trim() : null
    };

    try {
      await axios.put(`${API_URL}/${editProductId}`, payload, getConfig());
      alert("Product Updated Successfully");
      setIsEditModalOpen(false);
      loadProducts();
    } catch (error) {
      console.log(error);
      alert("Failed to update product");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`, getConfig());
      alert("Product Deleted");
      loadProducts();
    } catch (error) {
      console.log(error);
    }
  };

  // Stock In transaction
  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    if (!stockInQty || parseInt(stockInQty) <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/${selectedProduct.id}/stock-in`,
        {
          quantity: parseInt(stockInQty),
          reason: stockInReason,
          notes: stockInNotes
        },
        getConfig()
      );
      alert("Inventory quantity increased successfully.");
      setIsStockInModalOpen(false);
      setStockInQty("");
      setStockInNotes("");
      loadProducts();
    } catch (error) {
      alert("Failed to process Stock In.");
    }
  };

  // Stock Out transaction
  const handleStockOutSubmit = async (e) => {
    e.preventDefault();
    if (!stockOutQty || parseInt(stockOutQty) <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    if (selectedProduct.stock < parseInt(stockOutQty)) {
      alert("Deduction quantity exceeds current stock level.");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/${selectedProduct.id}/stock-out`,
        {
          quantity: parseInt(stockOutQty),
          reason: stockOutReason,
          notes: stockOutNotes
        },
        getConfig()
      );
      alert("Inventory quantity decreased successfully.");
      setIsStockOutModalOpen(false);
      setStockOutQty("");
      setStockOutNotes("");
      loadProducts();
    } catch (error) {
      alert("Failed to process Stock Out.");
    }
  };

  const handlePOSubmit = async (e) => {
    e.preventDefault();
    if (!poProdName || !poQty || !poPrice) {
      alert("Please fill in PO request details.");
      return;
    }
    try {
      await axios.post(
        API_BASE_URL + "/api/inventory/purchases",
        {
          productName: poProdName,
          quantity: parseInt(poQty),
          price: parseFloat(poPrice),
          requestedBy: poRequester
        },
        getConfig()
      );
      alert("Purchase Request submitted successfully!");
      setIsPOModalOpen(false);
      setPoProdName("");
      setPoQty("");
      setPoPrice("");
    } catch (error) {
      alert("Failed to submit purchase request.");
    }
  };

  const openStockInModal = (prod) => {
    setSelectedProduct(prod);
    setStockInReason("New Stock");
    setIsStockInModalOpen(true);
  };

  const openStockOutModal = (prod) => {
    setSelectedProduct(prod);
    setStockOutReason("Sale");
    setIsStockOutModalOpen(true);
  };

  const openHistoryModal = async (prod) => {
    try {
      setSelectedProduct(prod);
      const res = await axios.get(`${API_URL}/${prod.id}/stock-history`, getConfig());
      setStockHistoryList(res.data || []);
      setIsHistoryModalOpen(true);
    } catch (error) {
      alert("Failed to load stock movement log");
    }
  };

  const openEditModal = (prod) => {
    setEditProductId(prod.id);
    setEditName(prod.name || "");
    setEditCategory(prod.category || "Hardware");
    setEditSupplier(prod.supplier || "Dell Inc.");
    setEditPurchasePrice(prod.purchasePrice || "");
    setEditSellingPrice(prod.sellingPrice || "");
    setEditGst(prod.gst || "18.0");
    setEditWarehouse(prod.warehouse || "Warehouse A");
    setEditStock(prod.stock || "");
    setEditMinStock(prod.minStock || "5");
    setEditExpiryDate(prod.expiryDate || "");
    setEditBatchNumber(prod.batchNumber || "");
    setEditSku(prod.sku || "");
    setIsEditModalOpen(true);
  };

  const clearForm = () => {
    setName("");
    setCategory("Hardware");
    setSupplier("Dell Inc.");
    setPurchasePrice("");
    setSellingPrice("");
    setGst("18.0");
    setWarehouse("Warehouse A");
    setStock("");
    setMinStock("5");
    setExpiryDate("");
    setBatchNumber("");
    setSku("");
  };

  const downloadImage = async (url, filename) => {
    try {
      const res = await fetch(url, getConfig());
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert("Download failed.");
    }
  };

  const handlePrint = (imageUrl, title) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label - ${title}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
            img { max-width: 100%; height: auto; }
            h3 { margin-bottom: 20px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h3>${title} Label</h3>
          <img src="${imageUrl}" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // KPIs
  const totalProducts = products.length;
  const totalValuation = products.reduce((acc, p) => acc + ((p.stock || 0) * (p.sellingPrice || 0)), 0);
  const lowStockCount = products.filter(p => (p.stock || 0) <= (p.minStock || 0)).length;
  const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;

  // Filter
  const filteredProducts = products.filter(prod => {
    const matchesSearch =
      (prod.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.sku || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse = selectedWarehouse === "ALL" || prod.warehouse === selectedWarehouse;
    return matchesSearch && matchesWarehouse;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const categories = ["Hardware", "Accessories", "Communication", "Raw Materials", "Office Supplies"];
  const suppliers = ["Dell Inc.", "Logitech", "Cisco", "Intel Corp.", "Apex Supplier"];
  const warehouses = ["Warehouse A", "Warehouse B", "Warehouse C"];

  return (
    <MainLayout>
      <div className="container-fluid mb-5">
        
        {/* Title Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h3 className="mb-1 text-primary font-bold"><FaBox /> Inventory & Stock Ledger</h3>
            <p className="text-secondary mb-0">Demonstrate corporate Stock In (Receive), Stock Out (Dispatch), and Movement History logging.</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary d-flex align-items-center gap-1.5" onClick={() => setIsPOModalOpen(true)}>
              <FaShoppingCart size={13} /> Purchase Request
            </button>
            <button className="btn btn-primary d-flex align-items-center gap-1.5" onClick={() => setIsAddModalOpen(true)}>
              <FaPlus size={12} /> Add Product
            </button>
          </div>
        </div>

        {/* Row 1: KPI Statistics */}
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card shadow-sm p-3 border-start border-4 border-primary h-100 bg-white">
              <h6 className="text-secondary font-semibold small uppercase mb-1">Total Products</h6>
              <h3 className="font-bold text-dark mb-0">{totalProducts}</h3>
              <span className="small text-secondary mt-1">Configured items</span>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card shadow-sm p-3 border-start border-4 border-success h-100 bg-white">
              <h6 className="text-secondary font-semibold small uppercase mb-1">Inventory Value</h6>
              <h3 className="font-bold text-success mb-0">₹{totalValuation.toLocaleString("en-IN")}</h3>
              <span className="small text-secondary mt-1">Current asset valuation</span>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card shadow-sm p-3 border-start border-4 border-warning h-100 bg-white">
              <h6 className="text-secondary font-semibold small uppercase mb-1">Low Stock Count</h6>
              <h3 className="font-bold text-warning mb-0">{lowStockCount}</h3>
              <span className="small text-secondary mt-1">Items below minimums</span>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card shadow-sm p-3 border-start border-4 border-danger h-100 bg-white">
              <h6 className="text-secondary font-semibold small uppercase mb-1">Out of Stock Count</h6>
              <h3 className="font-bold text-danger mb-0">{outOfStockCount}</h3>
              <span className="small text-secondary mt-1">Reorder required</span>
            </div>
          </div>
        </div>

        {/* Row 2: Search & Warehouse Filter */}
        <div className="card shadow-sm p-3 mb-4 bg-white border-0">
          <div className="row g-3">
            <div className="col-md-7">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-secondary"><FaSearch /></span>
                <input
                  className="form-control border-start-0"
                  placeholder="Filter by product name, category, or SKU..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-secondary"><FaFilter /></span>
                <select
                  className="form-select border-start-0 font-medium"
                  value={selectedWarehouse}
                  onChange={(e) => { setSelectedWarehouse(e.target.value); setCurrentPage(1); }}
                >
                  <option value="ALL">All Warehouses</option>
                  {warehouses.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-md-2">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearchTerm(""); setSelectedWarehouse("ALL"); }}>
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Product Table Ledger */}
        <div className="card shadow-sm p-4 mb-3 bg-white border-0">
          <div className="table-responsive">
            <table className="table table-modern align-middle" style={{ fontSize: "14px" }}>
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Stock Quantity</th>
                  <th>Price</th>
                  <th>Warehouse</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map(prod => {
                    const isLow = (prod.stock || 0) <= (prod.minStock || 0);
                    const isOut = (prod.stock || 0) === 0;
                    
                    let statusLabel = "Healthy";
                    let statusColor = "success";
                    if (isOut) {
                      statusLabel = "Out of Stock";
                      statusColor = "danger";
                    } else if (isLow) {
                      statusLabel = "Low Stock";
                      statusColor = "warning text-dark";
                    }

                    return (
                      <tr key={prod.id}>
                        <td><code>#{prod.id}</code></td>
                        <td>
                          <strong>{prod.name}</strong>
                          {prod.sku && <div className="small text-secondary">SKU: {prod.sku}</div>}
                        </td>
                        <td>{prod.category}</td>
                        <td><strong>{prod.stock} Units</strong></td>
                        <td>₹{(prod.sellingPrice || 0).toLocaleString()}</td>
                        <td>{prod.warehouse}</td>
                        <td>
                          <span className={`badge bg-${statusColor}`} style={{ fontSize: "11px" }}>
                            {statusLabel}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-1.5 justify-content-end">
                            <button className="btn btn-xs btn-success text-white py-1 px-2" onClick={() => openStockInModal(prod)}>
                              + Stock In
                            </button>
                            <button className="btn btn-xs btn-warning text-dark py-1 px-2" onClick={() => openStockOutModal(prod)}>
                              - Stock Out
                            </button>
                            <button className="btn btn-xs btn-outline-info py-1 px-2" onClick={() => openHistoryModal(prod)}>
                              <FaHistory size={11} /> History
                            </button>
                            <button className="btn btn-xs btn-outline-primary py-1 px-2" onClick={() => openEditModal(prod)} title="Edit Details">
                              Edit
                            </button>
                            <button className="btn btn-xs btn-outline-danger py-1 px-2" onClick={() => handleDeleteProduct(prod.id)} title="Delete Product">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-secondary">No products match your query criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2 border-top pt-3">
            <span className="small text-secondary">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} entries
            </span>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-xs btn-outline-primary py-1" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              >
                Previous
              </button>
              <span className="font-semibold align-self-center px-2" style={{ fontSize: "13px" }}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                className="btn btn-xs btn-outline-primary py-1" 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* MODAL 1: ADD PRODUCT MODAL */}
        {isAddModalOpen && (
          <div className="modal-overlay d-flex align-items-center justify-content-center animate-fade-in" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <div className="card shadow border-0 p-4" style={{ width: "500px", borderRadius: "14px", maxHeight: "90vh", overflowY: "auto" }}>
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h5 className="font-bold mb-0 text-primary">➕ Add Product</h5>
                <button className="btn btn-light rounded-circle p-1" onClick={() => setIsAddModalOpen(false)}><FaTimes /></button>
              </div>
              <form onSubmit={handleAddProduct}>
                <div className="mb-3">
                  <label className="form-label font-semibold small">Product Name</label>
                  <input className="form-control" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-semibold small">Category</label>
                    <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-semibold small">Supplier</label>
                    <select className="form-select" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                      {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-semibold small">Purchase Price (₹)</label>
                    <input type="number" className="form-control" required value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-semibold small">Selling Price (₹)</label>
                    <input type="number" className="form-control" required value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-semibold small">GST (%)</label>
                    <select className="form-select" value={gst} onChange={(e) => setGst(e.target.value)}>
                      <option value="5.0">5%</option>
                      <option value="12.0">12%</option>
                      <option value="18.0">18%</option>
                      <option value="28.0">28%</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-semibold small">Warehouse</label>
                    <select className="form-select" value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
                      {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-semibold small">Initial Stock</label>
                    <input type="number" className="form-control" required value={stock} onChange={(e) => setStock(e.target.value)} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-semibold small">Min Stock Alert Level</label>
                    <input type="number" className="form-control" required value={minStock} onChange={(e) => setMinStock(e.target.value)} />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-semibold small">Expiry Date</label>
                    <input type="date" className="form-control" required value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-semibold small">Batch Number</label>
                    <input className="form-control" required value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label font-semibold small">SKU Code (Optional)</label>
                  <input className="form-control" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Auto-generated if left blank" />
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-light w-50" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary w-50">Save Product</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: EDIT PRODUCT / DETAILS MODAL */}
        {isEditModalOpen && (
          <div className="modal-overlay d-flex align-items-center justify-content-center animate-fade-in" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <div className="card shadow border-0 p-4 animate-fade-in" style={{ width: "800px", borderRadius: "14px", maxHeight: "90vh", overflowY: "auto" }}>
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h5 className="font-bold mb-0 text-primary">✏️ Edit Product Details & Labels</h5>
                <button className="btn btn-light rounded-circle p-1" onClick={() => setIsEditModalOpen(false)}><FaTimes /></button>
              </div>
              <div className="row">
                {/* Left Side: Product Fields Form */}
                <div className="col-md-7 border-end pr-3">
                  <form onSubmit={handleEditProduct}>
                    <div className="mb-3">
                      <label className="form-label font-semibold small">Product Name</label>
                      <input className="form-control" required value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label font-semibold small">Category</label>
                        <select className="form-select" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label font-semibold small">Supplier</label>
                        <select className="form-select" value={editSupplier} onChange={(e) => setEditSupplier(e.target.value)}>
                          {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label font-semibold small">Purchase Price (₹)</label>
                        <input type="number" className="form-control" required value={editPurchasePrice} onChange={(e) => setEditPurchasePrice(e.target.value)} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label font-semibold small">Selling Price (₹)</label>
                        <input type="number" className="form-control" required value={editSellingPrice} onChange={(e) => setEditSellingPrice(e.target.value)} />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label font-semibold small">GST (%)</label>
                        <select className="form-select" value={editGst} onChange={(e) => setEditGst(e.target.value)}>
                          <option value="5.0">5%</option>
                          <option value="12.0">12%</option>
                          <option value="18.0">18%</option>
                          <option value="28.0">28%</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label font-semibold small">Warehouse</label>
                        <select className="form-select" value={editWarehouse} onChange={(e) => setEditWarehouse(e.target.value)}>
                          {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label font-semibold small">Current Stock</label>
                        <input type="number" className="form-control" required value={editStock} onChange={(e) => setEditStock(e.target.value)} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label font-semibold small">Min Stock Level</label>
                        <input type="number" className="form-control" required value={editMinStock} onChange={(e) => setEditMinStock(e.target.value)} />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label font-semibold small">Expiry Date</label>
                        <input type="date" className="form-control" required value={editExpiryDate} onChange={(e) => setEditExpiryDate(e.target.value)} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label font-semibold small">Batch Number</label>
                        <input className="form-control" required value={editBatchNumber} onChange={(e) => setEditBatchNumber(e.target.value)} />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="form-label font-semibold small">Product SKU</label>
                      <input className="form-control" required value={editSku} onChange={(e) => setEditSku(e.target.value)} />
                    </div>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-light w-50" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary w-50">Save Changes</button>
                    </div>
                  </form>
                </div>

                {/* Right Side: Barcode & QR code Display */}
                <div className="col-md-5 pl-3 d-flex flex-column align-items-center justify-content-center">
                  <h6 className="font-bold text-secondary mb-3 text-start w-100">Product Labels & Identity</h6>
                  
                  {/* Barcode Render Section */}
                  <div className="border rounded p-3 bg-light text-center w-100 mb-4">
                    <div className="small font-semibold text-secondary mb-2">Item 1D Barcode</div>
                    <img 
                      src={`${process.env.REACT_APP_API_BASE_URL || API_BASE_URL + ""}/api/inventory/products/${editProductId}/barcode`} 
                      alt="Barcode Tag" 
                      className="img-fluid border bg-white p-2 mb-2"
                      style={{ maxHeight: "75px" }}
                    />
                    <div className="d-flex gap-2 justify-content-center">
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => downloadImage(`${process.env.REACT_APP_API_BASE_URL || API_BASE_URL + ""}/api/inventory/products/${editProductId}/barcode`, `${editName}_barcode.png`)}>
                        Download
                      </button>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => handlePrint(`${process.env.REACT_APP_API_BASE_URL || API_BASE_URL + ""}/api/inventory/products/${editProductId}/barcode`, editName)}>
                        Print
                      </button>
                    </div>
                  </div>

                  {/* QR Code Render Section */}
                  <div className="border rounded p-3 bg-light text-center w-100">
                    <div className="small font-semibold text-secondary mb-2">Item QR Serialization</div>
                    <img 
                      src={`${process.env.REACT_APP_API_BASE_URL || API_BASE_URL + ""}/api/inventory/products/${editProductId}/qrcode`} 
                      alt="QR Tag" 
                      className="img-fluid border bg-white p-2 mb-2"
                      style={{ width: "120px", height: "120px" }}
                    />
                    <div className="d-flex gap-2 justify-content-center">
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => downloadImage(`${process.env.REACT_APP_API_BASE_URL || API_BASE_URL + ""}/api/inventory/products/${editProductId}/qrcode`, `${editName}_qrcode.png`)}>
                        Download
                      </button>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => handlePrint(`${process.env.REACT_APP_API_BASE_URL || API_BASE_URL + ""}/api/inventory/products/${editProductId}/qrcode`, editName)}>
                        Print
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: STOCK HISTORY LOGS MODAL */}
        {isHistoryModalOpen && selectedProduct && (
          <div className="modal-overlay d-flex align-items-center justify-content-center animate-fade-in" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <div className="card shadow border-0 p-4" style={{ width: "650px", borderRadius: "14px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h5 className="font-bold mb-0 text-primary"><FaHistory /> Stock History: {selectedProduct.name}</h5>
                <button className="btn btn-light rounded-circle p-1" onClick={() => setIsHistoryModalOpen(false)}><FaTimes /></button>
              </div>
              <div className="table-responsive" style={{ maxHeight: "350px" }}>
                <table className="table table-bordered table-sm small align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Timestamp</th>
                      <th>Type</th>
                      <th>Quantity Change</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockHistoryList.length > 0 ? (
                      stockHistoryList.map(h => (
                        <tr key={h.id}>
                          <td>{new Date(h.timestamp).toLocaleString("en-IN")}</td>
                          <td>
                            <span className={`badge bg-${h.actionType === "IN" ? "success" : "danger"}`}>{h.actionType}</span>
                          </td>
                          <td><strong>{h.quantityChanged} Units</strong></td>
                          <td>{h.notes}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center text-secondary py-3">No adjustments recorded for this item.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-primary w-100 mt-3" onClick={() => setIsHistoryModalOpen(false)}>Close Log</button>
            </div>
          </div>
        )}

        {/* MODAL 4: STOCK IN MODAL */}
        {isStockInModalOpen && selectedProduct && (
          <div className="modal-overlay d-flex align-items-center justify-content-center animate-fade-in" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <div className="card shadow border-0 p-4 animate-fade-in" style={{ width: "450px", borderRadius: "14px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h5 className="font-bold mb-0 text-success">📥 Stock In (Increase Inventory)</h5>
                <button className="btn btn-light rounded-circle p-1" onClick={() => setIsStockInModalOpen(false)}><FaTimes /></button>
              </div>
              <form onSubmit={handleStockInSubmit}>
                <div className="mb-3 bg-light p-2.5 rounded">
                  <div className="small font-semibold text-secondary">Product Selected:</div>
                  <strong>{selectedProduct.name}</strong>
                  <div className="small text-secondary">Current Quantity: {selectedProduct.stock} Units</div>
                </div>
                <div className="mb-3">
                  <label className="form-label font-semibold small">Stock In Quantity</label>
                  <input type="number" className="form-control" required value={stockInQty} onChange={e => setStockInQty(e.target.value)} placeholder="e.g. 20" />
                </div>
                <div className="mb-3">
                  <label className="form-label font-semibold small">Reason</label>
                  <select className="form-select" value={stockInReason} onChange={e => setStockInReason(e.target.value)}>
                    <option value="Purchase">Purchase</option>
                    <option value="Return">Return</option>
                    <option value="New Stock">New Stock</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="form-label font-semibold small">Additional Notes</label>
                  <textarea className="form-control" rows={3} value={stockInNotes} onChange={e => setStockInNotes(e.target.value)} placeholder="e.g. Replenishment shipment received from Apex suppliers" />
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-light w-50" onClick={() => setIsStockInModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success w-50 text-white">Confirm Stock In</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 5: STOCK OUT MODAL */}
        {isStockOutModalOpen && selectedProduct && (
          <div className="modal-overlay d-flex align-items-center justify-content-center animate-fade-in" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <div className="card shadow border-0 p-4 animate-fade-in" style={{ width: "450px", borderRadius: "14px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h5 className="font-bold mb-0 text-warning">📤 Stock Out (Decrease Inventory)</h5>
                <button className="btn btn-light rounded-circle p-1" onClick={() => setIsStockOutModalOpen(false)}><FaTimes /></button>
              </div>
              <form onSubmit={handleStockOutSubmit}>
                <div className="mb-3 bg-light p-2.5 rounded">
                  <div className="small font-semibold text-secondary">Product Selected:</div>
                  <strong>{selectedProduct.name}</strong>
                  <div className="small text-secondary">Current Quantity: {selectedProduct.stock} Units</div>
                </div>
                <div className="mb-3">
                  <label className="form-label font-semibold small">Stock Out Quantity</label>
                  <input type="number" className="form-control" required value={stockOutQty} onChange={e => setStockOutQty(e.target.value)} placeholder="e.g. 5" />
                </div>
                <div className="mb-3">
                  <label className="form-label font-semibold small">Reason</label>
                  <select className="form-select" value={stockOutReason} onChange={e => setStockOutReason(e.target.value)}>
                    <option value="Sale">Sale</option>
                    <option value="Damage">Damage</option>
                    <option value="Transfer">Transfer</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="form-label font-semibold small">Additional Notes</label>
                  <textarea className="form-control" rows={3} value={stockOutNotes} onChange={e => setStockOutNotes(e.target.value)} placeholder="e.g. Defective spools returned or customer sales order checkout" />
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-light w-50" onClick={() => setIsStockOutModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-warning w-50 text-dark">Confirm Stock Out</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 6: PURCHASE REQUEST */}
        {isPOModalOpen && (
          <div className="modal-overlay d-flex align-items-center justify-content-center animate-fade-in" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <div className="card shadow border-0 p-4 animate-fade-in" style={{ width: "450px", borderRadius: "14px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h5 className="font-bold mb-0 text-primary">🛒 Create Purchase Request</h5>
                <button className="btn btn-light rounded-circle p-1" onClick={() => setIsPOModalOpen(false)}><FaTimes /></button>
              </div>
              <form onSubmit={handlePOSubmit}>
                <div className="mb-3">
                  <label className="form-label font-semibold small">Product / Raw Material Name</label>
                  <input className="form-control" required value={poProdName} onChange={e => setPoProdName(e.target.value)} placeholder="e.g. Copper wire spool" />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-semibold small">Target Quantity</label>
                    <input type="number" className="form-control" required value={poQty} onChange={e => setPoQty(e.target.value)} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-semibold small">Estimated Unit Price (₹)</label>
                    <input type="number" className="form-control" required value={poPrice} onChange={e => setPoPrice(e.target.value)} />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label font-semibold small">Requested By</label>
                  <input className="form-control" required value={poRequester} onChange={e => setPoRequester(e.target.value)} />
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-light w-50" onClick={() => setIsPOModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary w-50">Submit Request</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

export default Products;