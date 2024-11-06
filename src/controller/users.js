import jwt from "jsonwebtoken";
import { connect } from "../databases";
import bcrypt from 'bcrypt';
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

    // Modificar la consulta para incluir los campos 'nombre' y 'email'
    const q = "SELECT contra, rol, nombre, email FROM perfil WHERE dni=?";
    const value = [dni];
    const [result] = await connection.query(q, value);

    if (result.length > 0) {
      // Comparar la contraseña ingresada con el hash almacenado en la base de datos
      const passwordMatch = await bcrypt.compare(contra, result[0].contra);

      if (passwordMatch) {
        const token = getToken({ dni: dni });
        const userRol = result[0].rol; // Obtener el rol del resultado
        const userNombre = result[0].nombre; // Obtener el nombre
        const userEmail = result[0].email; // Obtener el email

        return res.status(200).json({
          message: "Login correcto",
          success: true,
          token: token,
          rol: userRol, // Incluir el rol en la respuesta
          nombre: userNombre, // Incluir el nombre en la respuesta
          email: userEmail // Incluir el email en la respuesta
        });
      } else {
        return res.status(401).json({
          message: "La contraseña no coincide",
          success: false
        });
      }
    } else {
      return res.status(400).json({
        message: "El usuario no existe",
        success: false
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error en el servidor",
      error: error
    });
  }
};



// Función para crear usuarios desde el signup
export const createUsers = async (req, res) => {
  try {
    const cnn = await connect();
    const { dni, nombre, contra, email } = req.body;

    // Verificar si el usuario ya existe
    const userExist = await validate("dni", dni, "perfil", cnn);
    if (userExist) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(contra, 10); // 10 es el número de rondas de salting

    // Guardar el nuevo usuario con la contraseña hasheada
    const [result] = await cnn.query(
      "INSERT INTO perfil (dni, nombre, contra, email) VALUES (?, ?, ?, ?)",
      [dni, nombre, hashedPassword, email]  // Almacenar el hash de la contraseña
    );

    if (result.affectedRows === 1) {
      return res.status(200).json({ message: "Usuario creado correctamente", success: true });
    } else {
      return res.status(500).json({ message: "No se pudo crear el usuario", success: false });
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


// Función para obtener un producto por id_p
export const getProductoById = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el id del producto de los parámetros de la URL
    const cnn = await connect();
    const [rows] = await cnn.query(
      "SELECT * FROM productos WHERE id_p = ?",
      [id] // El valor del id se pasa como parámetro para evitar inyecciones SQL
    );

    // Verificar si se encontró el producto
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }

    res.status(200).json({ success: true, producto: rows[0] });
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
    const { dni } = req.body; // DNI del usuario
    const cnn = await connect();
    const { id_p } = req.params; // ID del producto que se está editando
    const { nombre_producto, precio, stock } = req.body; // Datos del producto

    // Verificar si el producto existe
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
      // Si el usuario es admin, actualizar el producto directamente
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
      // Si el usuario no es admin, crear una solicitud con estado 'pendiente'
      const estado = 'pendiente'; // Estado de la solicitud
      const [requestResult] = await cnn.query(
        "INSERT INTO solicitudes (dni_usuario, id_p, estado) VALUES (?, ?, ?)",
        [dni, id_p, estado]
      );

      if (requestResult.affectedRows === 1) {
        return res.status(202).json({ message: "Solicitud de actualización enviada al administrador", success: true });
      } else {
        return res.status(500).json({ message: "No se pudo enviar la solicitud", success: false });
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Error desconocido", success: false });
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
      return res.status(200).json({ success: true, message: 'No hay solicitudes pendientes', solicitudes: [] });
    }

    res.status(200).json({ success: true, solicitudes: result });
  } catch (error) {
    console.error("Error al obtener las solicitudes:", error.message);
    res.status(500).json({ message: 'Error al obtener las solicitudes', success: false });
  }
};



export const aceptarSolicitud = async (req, res) => {
  const { id_p } = req.params; // Obtener el ID de la solicitud de los parámetros
  try {
    const cnn = await connect();
    await cnn.query('UPDATE productos SET estado = "aceptado" WHERE id_p = ?', [id_p]);
    res.status(200).json({ success: true, message: 'Solicitud aceptada' });
  } catch (error) {
    console.error("Error al aceptar la solicitud:", error);
    res.status(500).json({ success: false, message: 'Error al aceptar la solicitud' });
  }
};

export const rechazarSolicitud = async (req, res) => {
  const { id_p } = req.params; // Obtener el ID de la solicitud de los parámetros
  try {
    const cnn = await connect();
    const [result] = await cnn.query('DELETE FROM productos WHERE id_p = ?', [id_p]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    }
    
    res.status(200).json({ success: true, message: 'Solicitud rechazada y producto eliminado' });
  } catch (error) {
    console.error("Error al rechazar la solicitud:", error);
    res.status(500).json({ success: false, message: 'Error al rechazar la solicitud', error: error.message });
  }
};


// Función para modificar el usuario
export const modificarUsuario = async (req, res) => {
  try {
    const dni = req.params.dni; // Obtener DNI desde los parámetros de la URL
    const { nombre, email, contra, nuevoDni } = req.body; // Recibir los campos a actualizar

    // Si se proporciona una nueva contraseña, hashearla
    let hashedPassword = contra;
    if (contra) {
      hashedPassword = await bcrypt.hash(contra, 10); // Hasheamos la nueva contraseña
    }

    const connection = await connect();

    // Construir la consulta SQL para la actualización
    const updateQuery = `
      UPDATE perfil 
      SET 
        nombre = COALESCE(?, nombre), 
        email = COALESCE(?, email), 
        contra = COALESCE(?, contra), 
        dni = COALESCE(?, dni)
      WHERE dni = ?
    `;
    
    // Los valores de los campos a actualizar
    const values = [nombre, email, hashedPassword, nuevoDni, dni];

    const [result] = await connection.query(updateQuery, values);

    if (result.affectedRows > 0) {
      return res.status(200).json({
        message: "Usuario actualizado correctamente",
        success: true
      });
    } else {
      return res.status(400).json({
        message: "No se encontró el usuario o no hubo cambios",
        success: false
      });
    }
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    res.status(500).json({
      message: "Error en el servidor",
      error: error
    });
  }
};

export const deleteProducto = async (req, res) => {
  try {
    // Obtener el DNI y el id_p desde el cuerpo de la solicitud
    const { dni, id_p } = req.body; 

    // Establecer la conexión a la base de datos
    const cnn = await connect();  // Asegúrate de que esta función esté correctamente configurada

    // Obtener el rol del usuario desde la base de datos
    const [userResult] = await cnn.query('SELECT rol FROM perfil WHERE dni = ?', [dni]);
    console.log('Resultado de la consulta de usuario:', userResult);

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado', success: false });
    }

    const rol = userResult[0].rol; // Asumimos que el rol está en la primera fila

    // Verificar que el rol sea 'admin'
    if (rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para eliminar productos', success: false });
    }

    // Verificar si el producto existe antes de intentar borrarlo
    const [productoExistente] = await cnn.query('SELECT * FROM productos WHERE id_p = ?', [id_p]);

    if (productoExistente.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado', success: false });
    }

    // Eliminar el producto de la base de datos
    const [result] = await cnn.query('DELETE FROM productos WHERE id_p = ?', [id_p]);

    if (result.affectedRows === 1) {
      return res.status(200).json({ message: 'Producto eliminado exitosamente', success: true });
    } else {
      return res.status(500).json({ message: 'No se pudo eliminar el producto', success: false });
    }
  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    return res.status(500).json({ message: 'Error al eliminar el producto', success: false });
  }
};








