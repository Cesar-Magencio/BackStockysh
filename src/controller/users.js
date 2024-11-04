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

// Función para obtener la lista de productos por fecha 
export const getProductos = async (req, res) => {
  try {
    const cnn = await connect();
    const [rows] = await cnn.query(
      "SELECT * FROM productos ORDER BY updated_at DESC"
    );
    res.status(200).json({ success: true, productos: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// Función para crear un producto en la base de datos
// users.controller.js
export const createProducto = async (req, res) => {
  try {
    const { dni } = req.body; // Supongamos que el DNI del usuario está disponible en req.user
    const { nombre_producto, precio, stock } = req.body;

    console.log('Datos recibidos:', { dni, nombre_producto, precio, stock });

    if (!nombre_producto || !precio || !stock) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const cnn = await connect();

    // Obtener el rol del usuario desde la base de datos
    const [userResult] = await cnn.query('SELECT rol FROM perfil WHERE dni = ?', [dni]);
    console.log('Resultado de la consulta de usuario:', userResult);

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado', success: false });
    }

    const rol = userResult[0].rol;
    const estado = (rol === 'admin') ? 'aprobado' : 'pendiente';

    console.log('Rol del usuario:', rol);
    console.log('Estado del producto:', estado);

    // Crear el producto en la base de datos
    const [result] = await cnn.query(
      'INSERT INTO productos (nombre_producto, precio, stock, estado) VALUES (?, ?, ?, ?)',
      [nombre_producto, precio, stock, estado]
    );

    console.log('Resultado de la creación del producto:', result);

    // Notificar al admin si el producto está pendiente
    if (estado === 'pendiente') {
      // Lógica de notificación (ej. envío de email)
      console.log('Notificación al admin: producto en estado pendiente');
    }

    res.status(201).json({ message: 'Producto creado', success: true });
  } catch (error) {
    console.error('Error al crear el producto:', error);
    res.status(500).json({ message: 'Error al crear el producto', success: false });
  }
};





///////////////////////////////////////////////////////////////////////

//Funcion para Modificar productos
export const updateProducto = async (req, res) => {
  try {
    const { dni } = req.body; // Supongamos que el DNI del usuario está disponible en req.user
    const cnn = await connect();
    const { id_p } = req.params; // Obtenemos el ID del producto desde los parámetros de la ruta
    const { nombre_producto, precio, stock } = req.body;

    // Verificar si el producto existe antes de intentar actualizarlo
    const productoExistente = await validate("id_p", id_p, "productos", cnn);
    if (!productoExistente) {
      return res.status(404).json({ message: "Producto no encontrado", success: false });
    }

    // Obtener el rol del usuario desde la base de datos
    const [userResult] = await cnn.query('SELECT rol FROM perfil WHERE dni = ?', [dni]);

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado', success: false });
    }

    const rol = userResult[0].rol;

    if (rol === 'admin') {
      // Si el usuario es admin o superusuario, se actualiza el producto directamente
      const [result] = await cnn.query(
        "UPDATE productos SET nombre_producto = ?, precio = ?, stock = ? WHERE id_p = ?",
        [nombre_producto, precio, stock, id_p]
      );

      if (result.affectedRows === 1) {
        return res.status(200).json({ message: "Producto actualizado exitosamente", success: true });
      } else {
        return res.status(500).json({ message: "No se pudo actualizar el producto", success: false });
      }
    } else {
      // Si el usuario no es admin, enviar una solicitud al admin
      const estado = 'pendiente'; // Estado de la solicitud
      const [requestResult] = await cnn.query(
        "INSERT INTO solicitudes (dni_usuario, id_producto, estado) VALUES (?, ?, ?)",
        [dni, id_p, estado]
      );

      if (requestResult.affectedRows === 1) {
        return res.status(202).json({ message: "Solicitud de actualización enviada al administrador", success: true });
      } else {
        return res.status(500).json({ message: "No se pudo enviar la solicitud", success: false });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const getSolicitudes = async (req, res) => {
  try {
    const { dni } = req.body; // Obtener el DNI del cuerpo de la solicitud

    if (!dni) {
      return res.status(400).json({ message: 'DNI requerido', success: false });
    }

    const cnn = await connect();

    // Obtener el rol del usuario desde la base de datos
    const [userResult] = await cnn.query('SELECT rol FROM perfil WHERE dni = ?', [dni]);
    console.log('Resultado de la consulta de usuario:', userResult);

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado', success: false });
    }

    const rol = userResult[0].rol;
    console.log('Rol del usuario:', rol); // Para depuración



    // Obtener los productos en estado pendiente
    const [result] = await cnn.query('SELECT * FROM productos WHERE estado = "pendiente"');

    if (result.length === 0) {
      return res.status(404).json({ message: 'No hay solicitudes pendientes', success: false });
    }

    res.status(200).json({ success: true, solicitudes: result });
  } catch (error) {
    console.error("Error al obtener las solicitudes:", error);
    res.status(500).json({ message: 'Error al obtener las solicitudes', success: false });
  }
};