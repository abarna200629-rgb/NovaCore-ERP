import api from "./api";

export const getAttendance =
  () =>
    api.get(
      "/api/hr/attendance"
    );

export const addAttendance =
  (attendance) =>
    api.post(
      "/api/hr/attendance",
      attendance
    );

export const checkoutAttendance =
  (id) =>
    api.put(
      `/api/hr/attendance/checkout/${id}`
    );

export const deleteAttendance =
  (id) =>
    api.delete(
      `/api/hr/attendance/${id}`
    );