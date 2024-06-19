
-- Crear la tabla 'alumno'
CREATE TABLE IF NOT EXISTS alumno (
    dni INT(10) PRIMARY KEY NOT NULL,
    nombre VARCHAR(20),
    contra VARCHAR(100)
);

-- Crear la tabla 'materia'
CREATE TABLE materia (
  id_m INT PRIMARY KEY AUTO_INCREMENT,
  nombre_materia VARCHAR(100)
);

-- Crear la tabla 'cursar' con claves foráneas
CREATE TABLE cursar (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dni VARCHAR(20),
  id_m INT,
  FOREIGN KEY (dni) REFERENCES alumno(dni),
  FOREIGN KEY (id_m) REFERENCES materia(id_materia)
);
