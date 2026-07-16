import API from "./api";

// Get All Products

export const getProducts =
  async () => {

    return await API.get(
      "/inventory/products"
    );

  };

// Get Product By ID

export const getProductById =
  async (id) => {

    return await API.get(
      `/inventory/products/${id}`
    );

  };

// Add Product

export const addProduct =
  async (product) => {

    return await API.post(
      "/inventory/products",
      product
    );

  };

// Update Product

export const updateProduct =
  async (
    id,
    product
  ) => {

    return await API.put(
      `/inventory/products/${id}`,
      product
    );

  };

// Delete Product

export const deleteProduct =
  async (id) => {

    return await API.delete(
      `/inventory/products/${id}`
    );

  };