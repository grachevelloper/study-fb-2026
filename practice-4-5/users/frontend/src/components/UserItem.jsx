import React from "react";

export default function UserItem({ user, onEdit, onDelete }) {
    const getRoleBadge = (role) => {
        const badges = {
            admin: { color: '#dc3545', text: 'Админ' },
            moderator: { color: '#ffc107', text: 'Модератор' },
            user: { color: '#28a745', text: 'Пользователь' }
        };
        return badges[role] || badges.user;
    };

    const roleInfo = getRoleBadge(user.role);

    return (
        <div className={`userRow ${!user.isActive ? 'userRow--inactive' : ''}`}>
            <div className="userMain">
                <div className="userId">#{user.id}</div>
                    <div className="userName">
                        {user.firstName} {user.lastName}
                    </div>
                    <div className="userDetails">{user.age} лет</div>
                    {user.address && (
                        <div className="userAddress">
                             {user.address.city}, {user.address.country}
                            {user.address.zipCode && `, ${user.address.zipCode}`}
                        </div>
                    )}
            </div>



            <div className="userActions">
                <button className="btn" onClick={() => onEdit(user)}>
                     Редактировать
                </button>
                <button className="btn btn--danger" onClick={() => onDelete(user.id)}>
                     Удалить
                </button>
            </div>
        </div>
    );
}