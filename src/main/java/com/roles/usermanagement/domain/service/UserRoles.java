package com.roles.usermanagement.domain.service;

// Roles y permisos (el arranque crea estos permisos y se los da a ADMIN)
public class UserRoles {
    public enum Role { ADMIN, CUSTOMER }

    public enum Authority {
        USER_READ, USER_CREATE, USER_UPDATE, USER_DELETE, ROLE_ASSIGN, PERMISSION_ASSIGN, ROLE_MANAGE, PERMISSION_MANAGE,
        CATEGORIA_READ, CATEGORIA_CREATE, CATEGORIA_UPDATE, CATEGORIA_DELETE,
        ARTICULO_READ, ARTICULO_CREATE, ARTICULO_UPDATE, ARTICULO_DELETE, ARTICULO_STOCK,
        PEDIDO_READ, PEDIDO_CREATE, PEDIDO_STATUS;

        public String value() {
            return name();
        }
    }
}
