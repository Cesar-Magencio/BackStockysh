//archivo para manejar las rutas de usuarios

import { Router } from "express";
import {
  auth,
  createUsers,
  getproductosbyDni,
  logIn,
  Cursar,
  getproductosByID,
  createProducto,
  updateProducto,
} from "../controller/users";

//objeto para manejo de url
const routerUsers = Router();

//Enpoint para loguear usuario
/**
 * @swagger
 * /user/login:
 *  post:
 *      sumary: loguear usuario
 */
routerUsers.post("/user/login", logIn);

/**
 * @swagger
 * /usersp:
 *  post:
 *      sumary: crea usuarios
 */

routerUsers.post("/user/usersp", createUsers);

/**
 * @swagger
 * /materias:
 *  post:
 *      sumary: devuelve las materias para un usuario determinado
 */
routerUsers.get("/user/getproductos", auth, getproductosbyDni);

/**
 * @swagger
 * /productos:
 *  post:
 *      sumary: crea un producto
 */
routerUsers.post("/user/createProducto", auth, createProducto);


/**
 * @swagger
 * /productos:
 *  post:
 *      sumary: Modifica un producto
 */
routerUsers.put('/user/updateProducto/:id_p', auth,updateProducto);


/**
 * @swagger
 * /user/Cursar:
 *  post:
 *      summary: Asigna materias a un usuario
 */
routerUsers.post("/user/Cursar", auth, Cursar);



/**
 * @swagger
 * /user/getMateriasByID/:dni:
 *  get:
 *      sumary: obtiene las materias que cursa un alumno por su DNI
 */
routerUsers.get("/user/getproductosByID/:dni", auth, getproductosByID); // Añadir la nueva ruta

export default routerUsers;
