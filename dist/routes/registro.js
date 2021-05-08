"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const env_1 = __importDefault(require("../enviroments/env"));
const mongo_helper_1 = __importDefault(require("../helpers/mongo.helper"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const token_helper_1 = __importDefault(require("../helpers/token.helper"));
const Routes = express_1.Router();
const mongo = mongo_helper_1.default.getInstance(env_1.default.MONGODB);
const tokenHelper = token_helper_1.default(env_1.default, mongo);
Routes.post('/registro', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { correo, contraseña, nombreCompleto } = req.body;
    try {
        mongo.setDataBase('dbMTWyM');
        const result = yield mongo.db.collection('usuarios').findOne({ correo });
        if (!result) {
            const result2 = yield mongo.db.collection('usuarios').insertOne({
                correo, contrasena: bcrypt_1.default.hashSync(contraseña, 11), nombreCompleto, fotoUrl: null, isValid: false, oauth2: false, createdDate: new Date()
            });
            return res.status(200).json({
                ok: false,
                msg: `Registro finalizado con exito, recibiste un correo electronico para validarlo`
            });
        }
        else {
            return res.status(500).json({
                ok: false,
                msg: `El correo ${correo} ya esta registrado`
            });
        }
    }
    catch (error) {
        return res.status(500).json({
            ok: false,
            msg: `Error en el servidor`
        });
    }
}));
Routes.post('/registroOauth', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { correo, nombreCompleto, fotoUrl } = req.body;
    try {
        mongo.setDataBase('dbMTWyM');
        const result = yield mongo.db.collection('usuarios').findOne({ correo });
        console.log(result);
        if (!result) {
            const result2 = yield mongo.db.collection('usuarios').insertOne({
                correo, contraseña: null, nombreCompleto, fotoUrl, isValid: false, oauth2: true, createdDate: new Date()
            });
            return res.status(200).json({
                ok: false,
                msg: `Registro finalizado con exito, recibiste un correo electronico para validarlo`
            });
        }
        else {
            return res.status(500).json({
                ok: false,
                msg: `El correo ${correo} ya esta registrado`
            });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: `Error en el servidor`
        });
    }
}));
Routes.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    let { correo, contraseña, apikey } = req.body;
    try {
        mongo.setDataBase('dbMTWyM');
        const result = yield mongo.db.collection('usuarios').findOne({ correo });
        if (result) {
            /*if(result.isValid==false){
                return res.status(401).json({
                    ok:false,
                    msg:`No has habilitado tu cuenta, en tu correo te mandamos un mail para que puedas darlo de alta`
                });
            }*/
            if (result.oauth2 == true && result.contrasena == null) {
                return res.status(401).json({
                    ok: false,
                    msg: `No has habilitado una contraseña para este correo. Intenta entrar con el boton de Gmail`
                });
            }
            if (!bcrypt_1.default.compareSync(contraseña, result.contrasena)) {
                return res.status(500).json({
                    ok: false,
                    msg: `Credenciales incorrectas`
                });
            }
            const token = yield tokenHelper.create({ correo, nombreCompleto: result.nombreCompleto, fotoUrl: result.fotoUrl }, apikey);
            console.log(token);
            return res.status(200).json({
                ok: true,
                token: token.token
            });
        }
        else {
            return res.status(500).json({
                ok: false,
                msg: `Credenciales incorrectas`
            });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: `Error en el servidor`
        });
    }
}));
exports.default = Routes;
