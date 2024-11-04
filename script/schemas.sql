
-- Crear la tabla 'perfil'
CREATE TABLE IF NOT EXISTS perfil (
    dni INT(10) PRIMARY KEY NOT NULL,
    nombre VARCHAR(20),
    contra VARCHAR(100),
    email VARCHAR(255)UNIQUE,
);

-- Crear la tabla 'productos'
CREATE TABLE productos (
  id_p INT PRIMARY KEY AUTO_INCREMENT,
  nombre_producto VARCHAR(100),
  precio INT(10),
  stock INT(10),
  created_at TIMESTAMP DEFAULT,
  updated_at TIMESTAMP DEFAULT,
  estado VARCHAR (255),
);

