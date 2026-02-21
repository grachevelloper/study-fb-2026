import React from "react";

export default function ProductItem({ product, onEdit, onDelete }) {
    return (
        <div className="productRow">
            <div className="productMain">
                <div className="productId">#{product.id}</div>
                <div className="productName">{product.name}</div>
                <div className="productCategory">{product.category}</div>
                <div className="productDescription">{product.description}</div>
                <div className="productPrice">{product.price} рублей</div>
                <div className="productQuantity">{product.quantity} штук</div>
            </div>

            <div className="productActions">
                <button className="btn btn--edit" onClick={() => onEdit(product)}>
                    Редактировать  
                </button>
                <button className="btn btn--danger" onClick={() =>onDelete(product.id)}>
                    Удалить  
                </button>
            </div>
        </div>
    );
}