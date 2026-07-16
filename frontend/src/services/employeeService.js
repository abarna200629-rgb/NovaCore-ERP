import api from "./api";

export const getEmployees =
  () =>
    api.get(
      "/api/employees"
    );

export const addEmployee =
  (employee) =>
    api.post(
      "/api/employees",
      employee
    );

export const updateEmployee =
  (id, employee) =>
    api.put(
      `/api/employees/${id}`,
      employee
    );

export const deleteEmployee =
  (id) =>
    api.delete(
      `/api/employees/${id}`
    );