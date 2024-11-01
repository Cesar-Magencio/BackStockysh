
-- Crear la tabla 'perfil'
CREATE TABLE IF NOT EXISTS perfil (
    dni INT(10) PRIMARY KEY NOT NULL,
    nombre VARCHAR(20),
    contra VARCHAR(100)
);

-- Crear la tabla 'productos'
CREATE TABLE productos (
  id_p INT PRIMARY KEY AUTO_INCREMENT,
  nombre_poducto VARCHAR(100),
  precio INT(10),
  stock INT(10)
);

/*
-- Crear la tabla 'cursar' con claves foráneas
CREATE TABLE  (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dni VARCHAR(20),
  id_m INT,
  FOREIGN KEY (dni) REFERENCES alumno(dni),
  FOREIGN KEY (id_m) REFERENCES materia(id_materia)
);*/
