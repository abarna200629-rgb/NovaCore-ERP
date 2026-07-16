import API from "./api";

// Get All Leaves

export const getLeaves =
async () => {


return await API.get(
  "/hr/leaves"
);


};

// Apply Leave

export const applyLeave =
async (leave) => {


return await API.post(
  "/hr/leaves",
  leave
);


};

// Delete Leave

export const deleteLeave =
async (id) => {


return await API.delete(
  "/hr/leaves/${id}"
);


};
