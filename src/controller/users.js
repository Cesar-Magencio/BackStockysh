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
    const q = "SELECT contra FROM perfil WHERE dni=?";
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

    const userExist = await validate("dni", dni, "perfil", cnn);
    if (userExist) {
      return res.status(400).json({ message: "el usuario ya existe" });
    }

    const [result] = await cnn.query(
      "INSERT INTO perfil (dni, nombre, contra) VALUES (?, ?, ?)",
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

// Función para obtener la lista de productos por DNI
export const getproductosbyDni = (req, res) => {
  const dni = req.payload;
  console.log(dni);

  const productos = [
    { id: 1, nombre: "Zapatos Paruolo" },
    { id: 2, nombre: "Vestido Maria Cher" },
    { id: 3, nombre: "Tacos Sarkany" },
    { id: 4, nombre: "Jean Ay Not Dead" },
  ];
  return res.status(200).json(productos);
};



// Función para crear un producto en la base de datos
// users.controller.js
export const createProducto = async (req, res) => {
  try {
    const cnn = await connect();
    const { nombre_poducto, precio, stock } = req.body;

    // Validar si el producto ya existe en la base de datos
    const productoExistente = await validate(
      "nombre_poducto",
      nombre_poducto,
      "productos",
      cnn
    );

    if (productoExistente) {
      return res
        .status(400)
        .json({ message: "El producto ya existe", success: false });
    }

    // Insertar el nuevo producto en la base de datos
    const [result] = await cnn.query(
      "INSERT INTO productos (nombre_poducto, precio, stock) VALUES (?, ?, ?)",
      [nombre_poducto, precio, stock]
    );

    if (result.affectedRows === 1) {
      return res
        .status(200)
        .json({ message: "Se creó el producto", success: true });
    } else {
      return res
        .status(500)
        .json({ message: "No se creó el producto", success: false });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};




///////////////////////////////////////////////////////////////////////

//Funcion para Modificar productos
export const updateProducto = async (req, res) => {
  try {
    const cnn = await connect();
    const { id_p } = req.params; // Obtenemos el ID del producto desde los parámetros de la ruta
    const { nombre_poducto, precio, stock } = req.body;

    // Verificar si el producto existe antes de intentar actualizarlo
    const productoExistente = await validate("id_p", id_p, "productos", cnn);
    if (!productoExistente) {
      return res
        .status(404)
        .json({ message: "Producto no encontrado", success: false });
    }

    // Actualizar el producto en la base de datos
    const [result] = await cnn.query(
      "UPDATE productos SET nombre_poducto = ?, precio = ?, stock = ? WHERE id_p = ?",
      [nombre_poducto, precio, stock, id_p]
    );

    if (result.affectedRows === 1) {
      return res
        .status(200)
        .json({ message: "Producto actualizado exitosamente", success: true });
    } else {
      return res
        .status(500)
        .json({ message: "No se pudo actualizar el producto", success: false });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};



// Función para asignar productos a un perfil
export const Cursar = async (req, res) => {
  try {
    const { dni, productos_ids } = req.body;
    const cnn = await connect();

    // Validar si el perfil existe
    const perfilExiste = await validate("dni", dni, "perfil", cnn);
    if (!perfilExiste) {
      return res
        .status(400)
        .json({ message: "El perfil no existe", success: false });
    }

    // Asignar productos al perfil
    for (const id_m of productos_ids) {
      const productoExiste = await validate("id_m", id_m, "producto", cnn);
      if (!productoExiste) {
        return res.status(400).json({
          message: `La producto con id ${id_m} no existe`,
          success: false,
        });
      }

      // Insertar relación en la tabla "cursar"
      const q = `INSERT INTO cursar (dni, id_m) VALUES (?,?)`;
      const [result] = await cnn.query(q, [dni, id_m]);

      if (result.affectedRows !== 1) {
        return res.status(500).json({
          message: `No se pudo asignar la producto con id ${id_m} al perfil`,
          success: false,
        });
      }
    }

    return res
      .status(200)
      .json({ message: "productos asignadas correctamente", success: true });
  } catch (error) {
    return res.status(500).json({ message: "Fallo en catch", error: error });
  }
};

// Función para obtener las productos que cursa un perfil
export const getproductosByID = async (req, res) => {
  try {
    const { dni } = req.params; // Suponiendo que el dni viene en los parámetros de la URL
    const cnn = await connect();

    // Validar si el perfil existe
    const perfilExiste = await validate("dni", dni, "perfil", cnn);
    if (!perfilExiste) {
      return res
        .status(400)
        .json({ message: "El perfil no existe", success: false });
    }

    // Obtener las productos que cursa el perfil
    const q = `
      SELECT m.id_m, m.nombre_producto
      FROM cursar c
      JOIN producto m ON c.id_m = m.id_m
      WHERE c.dni = ?
    `;
    const [result] = await cnn.query(q, [dni]);

    if (result.length === 0) {
      return res.status(404).json({
        message: "No se encontraron productos para este perfil",
        success: false,
      });
    }

    return res.status(200).json({ productos: result, success: true });
  } catch (error) {
    return res.status(500).json({ message: "Fallo en catch", error: error });
  }
};
