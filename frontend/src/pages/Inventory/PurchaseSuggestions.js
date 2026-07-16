import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import api from "../../services/api";

function PurchaseSuggestions() {

    const [products, setProducts] = useState([]);

    const loadSuggestions = async () => {

        try {

            const response =
                await api.get(
                    "/inventory/purchase-suggestions"
                );

            setProducts(
                response.data
            );

        } catch (error) {

            console.log(error);

            alert(
                "Failed To Load Purchase Suggestions"
            );
        }
    };

    useEffect(() => {

        loadSuggestions();

    }, []);

    return (

        <MainLayout>

            <div className="container mt-4">

                <div className="card shadow p-4">

                    <h3 className="mb-4">

                        Purchase Suggestions

                    </h3>

                    <table className="table table-bordered table-striped">

                        <thead>

                            <tr>

                                <th>ID</th>

                                <th>Product</th>

                                <th>Current Stock</th>

                                <th>Minimum Stock</th>

                                <th>Suggested Purchase Qty</th>

                            </tr>

                        </thead>

                        <tbody>

                            {
                                products.length > 0
                                    ? products.map(
                                        (product) => (

                                            <tr
                                                key={
                                                    product.id
                                                }
                                            >

                                                <td>
                                                    {
                                                        product.id
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        product.productName
                                                    }
                                                </td>

                                                <td
                                                    style={{
                                                        color: "red",
                                                        fontWeight: "bold"
                                                    }}
                                                >
                                                    {
                                                        product.quantity
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        product.minStockLevel
                                                    }
                                                </td>

                                                <td
                                                    style={{
                                                        color: "green",
                                                        fontWeight: "bold"
                                                    }}
                                                >
                                                    {
                                                        (product.minStockLevel * 2)
                                                            - product.quantity
                                                    }
                                                </td>

                                            </tr>

                                        )
                                    )
                                    : (

                                        <tr>

                                            <td
                                                colSpan="5"
                                                className="text-center"
                                            >

                                                No Purchase Suggestions

                                            </td>

                                        </tr>

                                    )
                            }

                        </tbody>

                    </table>

                </div>

            </div>

        </MainLayout>

    );
}

export default PurchaseSuggestions;