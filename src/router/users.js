//archivo para manejar las rutas de usuarios

import { Router } from "express";
import {
  auth,
  createMateria,
  createUsers,
  getMateriasbyDni,
  logIn,
  Cursar,
  getMateriasByID,
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
routerUsers.get("/user/getMaterias", auth, getMateriasbyDni);

/**
 * @swagger
 * /materias:
 *  post:
 *      sumary: crea una materia
 */
routerUsers.post("/user/createMateria", auth, createMateria);

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
routerUsers.get("/user/getMateriasByID/:dni", auth, getMateriasByID); // Añadir la nueva ruta

export default routerUsers;
