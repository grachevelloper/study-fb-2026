import React, { useEffect, useState } from "react";

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit}) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");

    useEffect(() => {
        if (!open) return;
        setName(initialProduct?.name ?? "");
        setCategory(initialProduct?.category ?? "");
        setDescription(initialProduct?.description ?? "");
        setPrice(initialProduct?.price != null ? String(initialProduct.price) : "");
        setQuantity(initialProduct?.quantity != null ? String(initialProduct.quantity) : "");
    }, [open, initialProduct]);

    if (!open) return null;

    const title = mode === "edit" ? "Редактирование товара" : "Создание товара";
    
    const handleSubmit = (e) => {
        e.preventDefault();

        const trimmedName = name.trim();
        const trimmedCategory = category.trim();
        const trimmedDescription = description.trim();
        const parsedPrise = Number(price);
        const parsedQuantity = Number(quantity);

        if (!trimmedName) {
            alert("Введите имя");
            return;
        }
        if (!trimmedCategory) {
            alert("Введите категорию");
            return;
        }
        if (!trimmedDescription) {
            alert("Введите описание");
            return;
        }
        if (!Number.isFinite(parsedPrise) || parsedPrise < 0) {
            alert("Введите корректную цену");
            return;
        }
        if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
            alert("Введите корректное колличество");
            return;
        }

        onSubmit({
            id: initialProduct?.id,
            name: trimmedName,
            category: trimmedCategory,
            description: trimmedDescription,
            price: parsedPrise,
            quantity: parsedQuantity
        });
    };

    return (
        <div className="backdrop" onMouseDown={onClose}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()}role="dialog" aria-modal="true">
                <div className="modal__header">
                    <div className="modal__title">{title}</div>
                    <button className="iconBtn" onClick={onClose} aria-label="Закрыть">
                        ✕
                    </button>
                </div>

                <form className="form" onSubmit={handleSubmit}>
                    <label className="label">
                        Название  
                        <input
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Например, подушка"
                            autoFocus
                        />
                    </label>

                    <label className="label">
                        Категория  
                        <input
                            className="input"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Например, текстиль"
                            autoFocus
                        />
                    </label>

                    <label className="label">
                        Описание  
                        <input
                            className="input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Например, материал пух, цвет белый"
                            autoFocus
                        />
                    </label>

                    <label className="label">
                        Цена  
                        <input
                            className="input"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Например, 500"
                            inputMode="numeric"
                        />
                    </label>

                    <label className="label">
                        Количество  
                        <input
                            className="input"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Например, 10"
                            inputMode="numeric"
                        />
                    </label>

                    <div className="modal__footer">
                        <button type="button" className="btn btn--cancel" onClick={onClose}>
                            Отмена  
                        </button>
                        <button type="submit" className="btn btn--primary">
                            {mode === "edit" ? "Сохранить" : "Создать"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}