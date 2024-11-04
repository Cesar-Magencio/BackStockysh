//archivo para manejar las rutas de usuarios

import { Router } from "express";
import {
  auth,
  createUsers,
  logIn,
  createProducto,
  updateProducto,
  getProductos,
  getSolicitudes,
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

// users.router.js
routerUsers.get("/user/getProductos", auth, getProductos);

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
 * /productos:
 *  post:
 *      sumary: Agarra las solicitudes para mostrarlselas al admin
 */
routerUsers.get('/user/getSolicitudes',auth,getSolicitudes);




export default routerUsers;
