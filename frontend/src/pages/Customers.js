import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";

function Customers() {

  const [customers, setCustomers] = useState([]);

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const API_URL =
    (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/customers";

  const getConfig = () => {

    const token =
      localStorage.getItem("token");

    return {
      headers: {
        Authorization:
          `Bearer ${token}`
      }
    };
  };

  // Load Customers
  const loadCustomers = async () => {

    try {

      const response =
        await axios.get(
          API_URL,
          getConfig()
        );

      setCustomers(response.data);

    } catch (error) {

      console.error(error);

      if (
        error.response?.status === 401
      ) {
        alert(
          "Unauthorized. Please login again."
        );
      }
    }
  };

  useEffect(() => {

    loadCustomers();

  }, []);

  // Add Customer
  const addCustomer = async () => {

    if (
      customerName.trim() === ""
    ) {

      alert(
        "Customer Name Required"
      );

      return;
    }

    if (isDuplicateEmail) {
      alert("Email already exists.");
      return;
    }

    if (isDuplicatePhone) {
      alert("Phone number already exists.");
      return;
    }

    try {

      await axios.post(
        API_URL,
        {
          customerName,
          email,
          phone,
          address
        },
        getConfig()
      );

      alert(
        "Customer Added Successfully"
      );

      setCustomerName("");
      setEmail("");
      setPhone("");
      setAddress("");

      loadCustomers();

    } catch (error) {

      console.error(error);

      alert(
        "Failed To Add Customer"
      );
    }
  };

  // Delete Customer
  const deleteCustomer =
    async (id) => {

      const confirmDelete =
        window.confirm(
          "Delete Customer?"
        );

      if (!confirmDelete)
        return;

      try {

        await axios.delete(
          `${API_URL}/${id}`,
          getConfig()
        );

        alert(
          "Customer Deleted"
        );

        loadCustomers();

      } catch (error) {

        console.error(error);

        alert(
          "Delete Failed"
        );
      }
    };

    const isDuplicateEmail = email.trim() !== "" && customers.some(c => 
    c.email && c.email.trim().toLowerCase() === email.trim().toLowerCase()
  );

  const isDuplicatePhone = phone.trim() !== "" && customers.some(c => 
    c.phone && c.phone.trim() === phone.trim()
  );

  return (

    <MainLayout>

      <div className="container-fluid">

        {/* Customer Form */}

        <div className="card shadow p-4 mb-4">

          <h3 className="mb-4">
            Customer Management
          </h3>

          <div className="row g-3">

            <div className="col-md-3">

              <input
                type="text"
                className="form-control"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) =>
                  setCustomerName(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="col-md-3">

              <input
                type="email"
                className={`form-control ${isDuplicateEmail ? "is-invalid border-danger" : ""}`}
                placeholder="Email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
              />
              {isDuplicateEmail && <div className="text-danger small mt-1">Email already exists.</div>}

            </div>

            <div className="col-md-2">

              <input
                type="text"
                className={`form-control ${isDuplicatePhone ? "is-invalid border-danger" : ""}`}
                placeholder="Phone"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                  )
                }
              />
              {isDuplicatePhone && <div className="text-danger small mt-1">Phone number already exists.</div>}

            </div>

            <div className="col-md-3">

              <input
                type="text"
                className="form-control"
                placeholder="Address"
                value={address}
                onChange={(e) =>
                  setAddress(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="col-md-1">

              <button
                className="btn btn-success w-100"
                onClick={
                  addCustomer
                }
                disabled={isDuplicateEmail || isDuplicatePhone}
              >
                Add
              </button>

            </div>

          </div>

        </div>

        {/* Customer List */}

        <div className="card shadow p-4">

          <h3 className="mb-4">
            Customer List
          </h3>

          <table className="table table-bordered table-hover">

            <thead className="table-primary">

              <tr>

                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Action</th>

              </tr>

            </thead>

            <tbody>

              {customers.length > 0 ? (

                customers.map(
                  (customer) => (

                    <tr
                      key={customer.id}
                    >

                      <td>
                        {customer.id}
                      </td>

                      <td>
                        {
                          customer.customerName
                        }
                      </td>

                      <td>
                        {customer.email}
                      </td>

                      <td>
                        {customer.phone}
                      </td>

                      <td>
                        {customer.address}
                      </td>

                      <td>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            deleteCustomer(
                              customer.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="6"
                    className="text-center"
                  >
                    No Customers Found
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </MainLayout>

  );
}

export default Customers;