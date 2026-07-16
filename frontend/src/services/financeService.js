import API from "./api";

// Get All Transactions

export const getTransactions =
async () => {


return await API.get(
  "/finance"
);


};

// Add Transaction

export const addTransaction =
async (transaction) => {


return await API.post(
  "/finance",
  transaction
);


};

// Delete Transaction

export const deleteTransaction =
async (id) => {


return await API.delete(
  "/finance/${id}"
);


};
