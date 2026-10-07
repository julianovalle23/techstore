-- Base nueva: techstore_db (PostgreSQL)
-- Tablas de TechStore + seguridad de la plantilla (se crean solas por JPA).
-- Este script crea la base y deja datos de ejemplo TechStore.
CREATE DATABASE techstore_db ENCODING 'UTF8';

\c techstore_db;

-- 1) Categoria
CREATE TABLE IF NOT EXISTS categoria (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    estado VARCHAR(10) NOT NULL DEFAULT 'activa'
        CHECK (estado IN ('activa', 'inactiva'))
);

-- 2) Articulo (FK -> Categoria)
CREATE TABLE IF NOT EXISTS articulo (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    especificaciones TEXT,
    precio_unitario NUMERIC(12,2) NOT NULL CHECK (precio_unitario > 0),
    stock_actual INT NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo INT NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    fecha_ingreso DATE,
    categoria_id INT NOT NULL REFERENCES categoria(id)
);

-- 3) Pedido (FK -> Articulo)
CREATE TABLE IF NOT EXISTS pedido (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP NOT NULL DEFAULT NOW(),
    comprador_nombre VARCHAR(150) NOT NULL,
    comprador_documento VARCHAR(50),
    comprador_correo VARCHAR(150),
    comprador_telefono VARCHAR(50),
    articulo_id INT NOT NULL REFERENCES articulo(id),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL CHECK (precio_unitario > 0),
    total NUMERIC(12,2) NOT NULL CHECK (total > 0),
    metodo_pago VARCHAR(20) NOT NULL
        CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PAGADO', 'PENDIENTE', 'CANCELADO'))
);

-- Datos: 4 categorias
INSERT INTO categoria (nombre, descripcion, estado) VALUES
('Portatiles', 'Computadores portatiles', 'activa'),
('Escritorio', 'PCs y todo en uno', 'activa'),
('Accesorios', 'Teclados, mouse, audifonos', 'activa'),
('Almacenamiento', 'Discos SSD y memorias', 'inactiva')
ON CONFLICT (nombre) DO NOTHING;

-- Datos: 10 articulos
INSERT INTO articulo (codigo, nombre, marca, modelo, especificaciones, precio_unitario, stock_actual, stock_minimo, fecha_ingreso, categoria_id) VALUES
('SKU-LAP-001', 'Portatil Pro 14', 'TechBrand', 'TB-14', 'RAM 16GB, SSD 512GB, i7', 3200000, 10, 3, CURRENT_DATE, 1),
('SKU-LAP-002', 'Portatil Basico 15', 'TechBrand', 'TB-15', 'RAM 8GB, SSD 256GB, i3', 1800000, 2, 5, CURRENT_DATE, 1),
('SKU-PC-001', 'PC Torre Gamer', 'PowerPC', 'GMR-01', 'RTX 4060, 32GB RAM, 1TB SSD', 5500000, 6, 2, CURRENT_DATE, 2),
('SKU-PC-002', 'Todo en Uno 24', 'PowerPC', 'AIO-24', '24 pulgadas, 16GB RAM', 2800000, 8, 3, CURRENT_DATE, 2),
('SKU-ACC-001', 'Teclado Mecanico RGB', 'KeyPro', 'K100', 'Switch azul, espanol', 350000, 20, 5, CURRENT_DATE, 3),
('SKU-ACC-002', 'Mouse Inalambrico', 'KeyPro', 'M50', '2400 DPI, bateria 6 meses', 120000, 4, 5, CURRENT_DATE, 3),
('SKU-ACC-003', 'Audifonos Gamer', 'SoundX', 'HX-200', 'Sonido 7.1, microfono', 280000, 15, 4, CURRENT_DATE, 3),
('SKU-ALM-001', 'SSD 1TB NVMe', 'FastDisk', 'NV1T', 'Lectura 3500 MB/s', 420000, 12, 5, CURRENT_DATE, 4),
('SKU-ALM-002', 'Memoria USB 128GB', 'FastDisk', 'U128', 'USB 3.2', 90000, 1, 5, CURRENT_DATE, 4),
('SKU-LAP-003', 'Portatil Ultra 13', 'TechBrand', 'TB-13U', 'Ultraliviano, 1kg, 16GB', 4500000, 7, 2, CURRENT_DATE, 1)
ON CONFLICT (codigo) DO NOTHING;

-- Datos: 5 pedidos (total = cantidad x precio)
INSERT INTO pedido (comprador_nombre, comprador_documento, comprador_correo, comprador_telefono, articulo_id, cantidad, precio_unitario, total, metodo_pago, estado) VALUES
('Ana Perez', '1001', 'ana@mail.com', '3001112222', 1, 1, 3200000, 3200000, 'tarjeta', 'PAGADO'),
('Luis Gomez', '1002', 'luis@mail.com', '3003334444', 5, 2, 350000, 700000, 'efectivo', 'PAGADO'),
('Marta Ruiz', '1003', 'marta@mail.com', '3005556666', 6, 1, 120000, 120000, 'transferencia', 'PENDIENTE'),
('Carlos Diaz', '1004', 'carlos@mail.com', '3007778888', 8, 1, 420000, 420000, 'tarjeta', 'PENDIENTE'),
('Sofia Lopez', '1005', 'sofia@mail.com', '3009990000', 3, 1, 5500000, 5500000, 'efectivo', 'CANCELADO');
