import jwt from "jsonwebtoken";
import { connect } from "../databases";
const clavesecreta = process.env.SECRET_KEY;

// Función para generar un token JWT
const getToken = (payload) => {
  const token = jwt.sign(payload, clavesecreta, {
    expiresIn: "5555555555555555555555555555m",
  });
  return token;
};

// Función para validar la existencia de un registro en la base de datos
const validate = async (campo, valor, tabla, cnn) => {
  const q = `SELECT * FROM ${tabla} WHERE ${campo} = ?`;
  const value = [valor];
  const [result] = await cnn.query(q, value);
  return result.length === 1; // Devuelve true si existe un registro con el valor especificado
};

// Función para iniciar sesión
// Función para iniciar sesión
export const logIn = async (req, res) => {
  try {
    const { dni, contra } = req.body;
    const connection = await connect();
    const q = "SELECT contra FROM alumno WHERE dni=?";
    const value = [dni];
    const [result] = await connection.query(q, value);

    if (result.length > 0) {
      if (result[0].contra === contra) {
        const token = getToken({ dni: dni });
        return res
          .status(200)
          .json({ message: "correcto", success: true, token: token });
      } else {
        return res
          .status(401)
          .json({ message: "la contraseña no coincide", success: false });
      }
    } else {
      return res
        .status(400)
        .json({ message: "el usuario no existe", success: false });
    }
  } catch (error) {
    res.status(500).json({ message: "fallo en el catch", error: error });
  }
};

// Función para crear usuarios desde el signup
export const createUsers = async (req, res) => {
  try {
    const cnn = await connect();
    const { dni, nombre, contra } = req.body;

    const userExist = await validate("dni", dni, "alumno", cnn);
    if (userExist) {
      return res.status(400).json({ message: "el usuario ya existe" });
    }

    const [result] = await cnn.query(
      "INSERT INTO alumno (dni, nombre, contra) VALUES (?, ?, ?)",
      [dni, nombre, contra]
    );

    if (result.affectedRows === 1) {
      return res
        .status(200)
        .json({ message: "se creo el usuario", success: true });
    } else {
      return res
        .status(500)
        .json({ message: "El usuario no se creo", success: false });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

// Función para autenticar el token
export const auth = (req, res, next) => {
  const tokenFront = req.headers["auth"];
  if (!tokenFront) return res.status(400).json({ message: "no hay token" });

  jwt.verify(tokenFront, clavesecreta, (error, payload) => {
    if (error) {
      return res.status(400).json({ message: "el token no es valido" });
    } else {
      req.payload = payload;
      next();
    }
  });
};

// Función para obtener la lista de materias por DNI
export const getMateriasbyDni = (req, res) => {
  const dni = req.payload;
  console.log(dni);

  const materias = [
    { id: 1, nombre: "so2" },
    { id: 2, nombre: "web" },
    { id: 3, nombre: "webd" },
    { id: 4, nombre: "arquitectura" },
  ];
  return res.status(200).json(materias);
};

// Función para crear una materia en la base de datos
export const createMateria = async (req, res) => {
  try {
    const cnn = await connect();
    const { nombre_materia } = req.body;

    const materiaExistente = await validate(
      "nombre_materia",
      nombre_materia,
      "materia",
      cnn
    );

    if (materiaExistente) {
      return res
        .status(400)
        .json({ message: "La materia ya existe", success: false });
    }

    const [result] = await cnn.query(
      "INSERT INTO materia (nombre_materia) VALUES (?)",
      [nombre_materia]
    );

    if (result.affectedRows === 1) {
      return res
        .status(200)
        .json({ message: "Se creó la materia", success: true });
    } else {
      return res
        .status(500)
        .json({ message: "No se creó la materia", success: false });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

///////////////////////////////////////////////////////////////////////

// Función para asignar materias a un alumno
// Función para asignar materias a un alumno
// Función para asignar materias a un alumno
export const Cursar = async (req, res) => {
  try {
    const { dni, materias_ids } = req.body;
    const cnn = await connect();

    // Validar si el alumno existe
    const alumnoExiste = await validate("dni", dni, "alumno", cnn);
    if (!alumnoExiste) {
      return res
        .status(400)
        .json({ message: "El alumno no existe", success: false });
    }

    // Asignar materias al alumno
    for (const id_m of materias_ids) {
      const materiaExiste = await validate("id_m", id_m, "materia", cnn);
      if (!materiaExiste) {
        return res.status(400).json({
          message: `La materia con id ${id_m} no existe`,
          success: false,
        });
      }

      // Insertar relación en la tabla "cursar"
      const q = `INSERT INTO cursar (dni, id_m) VALUES (?,?)`;
      const [result] = await cnn.query(q, [dni, id_m]);

      if (result.affectedRows !== 1) {
        return res.status(500).json({
          message: `No se pudo asignar la materia con id ${id_m} al alumno`,
          success: false,
        });
      }
    }

    return res
      .status(200)
      .json({ message: "Materias asignadas correctamente", success: true });
  } catch (error) {
    return res.status(500).json({ message: "Fallo en catch", error: error });
  }
};

// Función para obtener las materias que cursa un alumno
export const getMateriasByID = async (req, res) => {
  try {
    const { dni } = req.params; // Suponiendo que el dni viene en los parámetros de la URL
    const cnn = await connect();

    // Validar si el alumno existe
    const alumnoExiste = await validate("dni", dni, "alumno", cnn);
    if (!alumnoExiste) {
      return res
        .status(400)
        .json({ message: "El alumno no existe", success: false });
    }

    // Obtener las materias que cursa el alumno
    const q = `
      SELECT m.id_m, m.nombre_materia
      FROM cursar c
      JOIN materia m ON c.id_m = m.id_m
      WHERE c.dni = ?
    `;
    const [result] = await cnn.query(q, [dni]);

    if (result.length === 0) {
      return res.status(404).json({
        message: "No se encontraron materias para este alumno",
        success: false,
      });
    }

    return res.status(200).json({ materias: result, success: true });
  } catch (error) {
    return res.status(500).json({ message: "Fallo en catch", error: error });
  }
};
