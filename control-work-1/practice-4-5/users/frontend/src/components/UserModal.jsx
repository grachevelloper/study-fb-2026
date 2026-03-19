import React, { useEffect, useState } from "react";

export default function UserModal({ open, mode, initialUser, onClose, onSubmit }) {
    const [userData, setUserData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        age: "",
        role: "user",
        phone: "",
        isActive: true,
        address: {
            city: "",
            country: "",
            zipCode: ""
        }
    });

    useEffect(() => {
        if (open && initialUser) {
            setUserData({
                id: initialUser.id || "",
                firstName: initialUser.firstName || "",
                lastName: initialUser.lastName || "",
                email: initialUser.email || "",
                age: initialUser.age != null ? String(initialUser.age) : "",
                role: initialUser.role || "user",
                phone: initialUser.phone || "",
                isActive: initialUser.isActive ?? true,
                address: {
                    city: initialUser.address?.city || "",
                    country: initialUser.address?.country || "",
                    zipCode: initialUser.address?.zipCode || ""
                }
            });
        }
        
        if (open && !initialUser) {
            setUserData({
                firstName: "",
                    id: "",
                lastName: "",
                email: "",
                age: "",
                role: "user",
                phone: "",
                isActive: true,
                address: {
                    city: "",
                    country: "",
                    zipCode: ""
                }
            });
        }
    }, [open, initialUser]);

    if (!open) return null;

    const title = mode === "edit" ? "Редактирование пользователя" : "Создание пользователя";

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setUserData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressField]: value
                }
            }));
        } else {
            setUserData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const trimmedFirstName = userData.firstName.trim();
        const trimmedLastName = userData.lastName.trim();
        const trimmedEmail = userData.email.trim();
        const parsedAge = Number(userData.age);

        if (!trimmedFirstName) {
            alert("Введите имя");
            return;
        }

        if (!trimmedLastName) {
            alert("Введите фамилию");
            return;
        }

        if (!trimmedEmail) {
            alert("Введите email");
            return;
        }

        if (!validateEmail(trimmedEmail)) {
            alert("Введите корректный email");
            return;
        }

        if (!Number.isFinite(parsedAge) || parsedAge < 0 || parsedAge > 150) {
            alert("Введите корректный возраст (0–150)");
            return;
        }

        const payload = {
            id: userData?.id,
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            email: trimmedEmail,
            age: parsedAge,
            role: userData.role,
            isActive: userData.isActive,
            phone: userData.phone.trim() || undefined,
        };

        if (userData.address.city || userData.address.country || userData.address.zipCode) {
            payload.address = {
                city: userData.address.city || undefined,
                country: userData.address.country || undefined,
                zipCode: userData.address.zipCode || undefined
            };
        }

        onSubmit(payload);
    };

    return (
        <div className="backdrop" onMouseDown={onClose}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="modal__header">
                    <div className="modal__title">{title}</div>
                    <button className="iconBtn" onClick={onClose} aria-label="Закрыть">
                        ✕
                    </button>
                </div>

                <form className="form" onSubmit={handleSubmit}>
                    <div className="formRow">
                        <label className="label">
                            Имя *
                            <input
                                className="input"
                                name="firstName"
                                value={userData.firstName}
                                onChange={handleChange}
                                placeholder="Иван"
                                autoFocus
                            />
                        </label>

                        <label className="label">
                            Фамилия *
                            <input
                                className="input"
                                name="lastName"
                                value={userData.lastName}
                                onChange={handleChange}
                                placeholder="Иванов"
                            />
                        </label>
                    </div>

                    <div className="formRow">
                        <label className="label">
                            Email *
                            <input
                                className="input"
                                name="email"
                                type="email"
                                value={userData.email}
                                onChange={handleChange}
                                placeholder="ivan@example.com"
                            />
                        </label>

                        <label className="label">
                            Возраст *
                            <input
                                className="input"
                                name="age"
                                value={userData.age}
                                onChange={handleChange}
                                placeholder="20"
                                inputMode="numeric"
                            />
                        </label>
                    </div>

                    <div className="formRow">
                        <label className="label">
                            Роль
                            <select
                                className="input"
                                name="role"
                                value={userData.role}
                                onChange={handleChange}
                            >
                                <option value="user">Пользователь</option>
                                <option value="admin">Админ</option>
                                <option value="moderator">Модератор</option>
                            </select>
                        </label>

                        <label className="label">
                            Телефон
                            <input
                                className="input"
                                name="phone"
                                value={userData.phone}
                                onChange={handleChange}
                                placeholder="+7-999-123-45-67"
                            />
                        </label>
                    </div>

                    <div className="formRow">
                        <label className="label checkbox">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={userData.isActive}
                                onChange={handleChange}
                            />
                            Активен
                        </label>
                    </div>

                    <div className="formSection">Адрес</div>

                    <div className="formRow">
                        <label className="label">
                            Город
                            <input
                                className="input"
                                name="address.city"
                                value={userData.address.city}
                                onChange={handleChange}
                                placeholder="Москва"
                            />
                        </label>

                        <label className="label">
                            Страна
                            <input
                                className="input"
                                name="address.country"
                                value={userData.address.country}
                                onChange={handleChange}
                                placeholder="Россия"
                            />
                        </label>
                    </div>

                    <div className="formRow">
                        <label className="label">
                            Индекс
                            <input
                                className="input"
                                name="address.zipCode"
                                value={userData.address.zipCode}
                                onChange={handleChange}
                                placeholder="190000"
                            />
                        </label>
                        <div className="label" />
                    </div>

                    <div className="modal__footer">
                        <button type="button" className="btn" onClick={onClose}>
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