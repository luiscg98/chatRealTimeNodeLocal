import { Router, Request, Response, NextFunction } from 'express';
import env from '../enviroments/env';
import MongooseHelper from '../helpers/mongo.helper'
import bcrypt from 'bcrypt';
import TokenHelper from '../helpers/token.helper';

const Routes = Router();
const mongo = MongooseHelper.getInstance(env.MONGODB);
const tokenHelper = TokenHelper(env, mongo);

Routes.post('/registro', async (req:Request, res:Response) => {

    let {correo,contraseña,nombreCompleto} = req.body;

    try {
        mongo.setDataBase('dbMTWyM');
        const result:any = await mongo.db.collection('usuarios').findOne({correo});

        if (!result){
            const result2: any = await mongo.db.collection('usuarios').insertOne({
                correo,contrasena:bcrypt.hashSync(contraseña,11), nombreCompleto, fotoUrl:null,isValid:false,oauth2:false,createdDate:new Date()
            });
            return res.status(200).json({
                ok:false,
                msg:`Registro finalizado con exito, recibiste un correo electronico para validarlo`
            });
        }
        else{
            return res.status(500).json({
                ok:false,
                msg:`El correo ${correo} ya esta registrado`
            });
        } 
    } catch (error) {
        return res.status(500).json({
            ok:false,
            msg:`Error en el servidor`
        });
    }
});

Routes.post('/registroOauth', async (req:Request, res:Response) => {

    let {correo,nombreCompleto,fotoUrl} = req.body;

    try {
        mongo.setDataBase('dbMTWyM');
        const result:any = await mongo.db.collection('usuarios').findOne({correo});
        console.log(result);

        if (!result){
            const result2: any = await mongo.db.collection('usuarios').insertOne({
                correo, contraseña:null,nombreCompleto,fotoUrl,isValid:false,oauth2:true,createdDate:new Date()
            });
            return res.status(200).json({
                ok:false,
                msg:`Registro finalizado con exito, recibiste un correo electronico para validarlo`
            });
        }
        else{
            return res.status(500).json({
                ok:false,
                msg:`El correo ${correo} ya esta registrado`
            });
        } 
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok:false,
            msg:`Error en el servidor`
        });
    }
});

Routes.post('/login', async (req:Request, res:Response) => {
    console.log(req.body);

    let {correo,contraseña,apikey} = req.body;

    try {
        mongo.setDataBase('dbMTWyM');
        const result:any = await mongo.db.collection('usuarios').findOne({correo});

        if (result){
            /*if(result.isValid==false){
                return res.status(401).json({
                    ok:false,
                    msg:`No has habilitado tu cuenta, en tu correo te mandamos un mail para que puedas darlo de alta`
                });
            }*/
            if(result.oauth2==true && result.contrasena==null){
                return res.status(401).json({
                    ok:false,
                    msg:`No has habilitado una contraseña para este correo. Intenta entrar con el boton de Gmail`
                });
            }
            if(!bcrypt.compareSync(contraseña,result.contrasena)){
                return res.status(500).json({
                    ok:false,
                    msg:`Credenciales incorrectas`
                });
            }
            

            const token:any = await tokenHelper.create({correo,nombreCompleto:result.nombreCompleto,fotoUrl:result.fotoUrl},apikey);
            console.log(token);

            return res.status(200).json({
                ok:true,
                token:token.token
            });
        }
        else{
            return res.status(500).json({
                ok:false,
                msg:`Credenciales incorrectas`
            });
        } 
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok:false,
            msg:`Error en el servidor`
        });
    }
});

export default Routes;