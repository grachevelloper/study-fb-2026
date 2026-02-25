import React from "react";

export default function ProductItem({ product, onEdit, onDelete }) {
    const quantity = product.quantity ?? product.stock ?? 0;
    
    return (
        <div className="productRow">
            <div className="productMain">
                <div className="productId">#{product.id}</div>
                <div className="productName">{product.name}</div>
                <div className="productCategory">{product.category}</div>
                <div className="productDescription">{product.description}</div>
                <div className="productPrice">{product.price} ₽</div>
                <div className="productQuantity">{quantity} шт</div>
            </div>

            <div className="productActions">
                <button className="btn" onClick={() => onEdit(product)}>
                    Редактировать  
                </button>
                <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
                    Удалить  
                </button>
            </div>
        </div>
    );
}