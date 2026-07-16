import API from "./api";

// Get All Sales

export const getSales =
async () => {


return await API.get(
  "/sales"
);


};

// Get Sales By ID

export const getSalesById =
async (id) => {


return await API.get(
  "/sales/${id}"
);


};

// Add Sales

export const addSales =
async (sales) => {


return await API.post(
  "/sales",
  sales
);


};

// Update Sales

export const updateSales =
async (
id,
sales
) => {


return await API.put(
  "/sales/${id}",
  sales
);


};

// Delete Sales

export const deleteSales =
async (id) => {


return await API.delete(
  "/sales/${id}"
);


};
