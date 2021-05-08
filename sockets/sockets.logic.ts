import { Socket } from "socket.io";
import jwt from 'jsonwebtoken';
import TokenHelper from '../helpers/token.helper';
import MongoHelper from '../helpers/mongo.helper';
import ENV from '../enviroments/env';

const mongo = MongoHelper.getInstance(ENV.MONGODB);
const tokenHelper=TokenHelper(ENV,mongo);

export default (mongo: any) => {

    return {
        /*eliminarConexion: async (socket:Socket) => {
            socket.on('logOut', async (payload:any) => {
                try {
                    console.log(payload);
                    let token:any = await tokenHelper.verify(payload.token,payload.apikey);
                    console.log(token);
                    let result = await mongo.db.collection('conectados').findOne({correo:token.tokenDecoded.correo});
                    if((result) && result.sesiones == 1){
                        await mongo.db.collection('conectados').remove({_id:result._id});
                    }
                    else if(result && result.sesiones>1){
                        await mongo.db.collection('conectados').replaceOne({_id:result._id},{correo:token.tokenDecoded.correo,sesiones:result.sesiones-1})
                    }
                    else {
                        console.log('No se encontro sesion conectada');
                    }
                } catch (error) {
                    console.log(error);
                }
            });
        },*/
        actualizarCorreo: async(io:any,socket: Socket) => {
            socket.on('actualizarCorreo', async(payload:any)=>{

                try {
                    let result :any= await tokenHelper.verify(payload.token,payload.apiKey);
                    let sockets = await mongo.db.collection('sockets').findOne({correo:result.tokenDecoded.correo});
                    if(result.ok==true && !sockets){
                        await mongo.db.collection('sockets').insertOne({
                            socketId:[socket.id],
                            correo:result.tokenDecoded.correo,
                        });
                    }

                    else if(result.ok==true && sockets){
                        await mongo.db.collection('sockets').findOneAndUpdate({
                            _id:sockets._id
                        },
                        { $push: { socketId: socket.id } });
                    }
                    let conectados = await mongo.db.collection('sockets').find({}).toArray();
                    io.emit('broadcast-message',conectados);

                } catch (error) {
                    console.log(error);
                }
                
            });
        },
        /*listenSocketConnect: async (socket: Socket) => {
            await mongo.db.collection('sockets')
                .insertOne({
                    socketId: socket.id,
                    usuario: null,
                    conectado:0
                })
                .then(console.log(result))
                .catch((error: any) => console.log(error));
        },*/
        signIn: (io: any, socket: Socket) => {
            socket.on('signIn', async (payload: any) => {
                console.log(payload);
                // Guardar en Base de Datos

                try {
                    await mongo.db.collection('sockets')
                    .findOneAndUpdate(
                        { socketId: socket.id },
                        { $set: { usuario: payload.email }}
                    )

                    let result = await mongo.db.collection('usuarios')
                    .findOneAndUpdate(
                        { correo: payload.email }, // Criterio de Busqueda
                        {
                            $set: {
                                nombreCompleto: payload.displayName,
                                fotoURL: payload.phtoUrl
                            }
                        }
                    )

                    console.log(payload);
                    const token:any = await tokenHelper.create({
                        correo:payload.email,
                        nombreCompleto:payload.displayName,
                        fotoUrl:payload.phtoURL 
                    }, payload.apiKey);

                    if(token.ok == true)
                    io.to(socket.id).emit('token',token.token);
                    //Guardar en base de datos cliente conectado
                } catch (error) {
                    console.log(error);
                }
                
            });
        },
        logOut: (io:any,socket:Socket) => {
            socket.on('logOut',async (payload:any)=>{
                try {
                    let token:any = await tokenHelper.verify(payload.token,payload.apikey);
                    if(token.ok == true){
                        let result = await mongo.db.collection('sockets').findOne({correo:token.tokenDecoded.correo});
                        console.log(result);
                        if(result){
                            if(result.socketId.length>1)
                            {
                                await mongo.db.collection('sockets').findOneAndUpdate(
                                    {_id:result._id},
                                    { $pull: { socketId: socket.id } },
                                    { multi: true }
                                )
                            }
                            else{
                                await mongo.db.collection('sockets').deleteOne({_id:result._id});
                            }
                        }
                        const conectados = await mongo.db.collection('sockets').find({}).toArray();
                        io.emit('broadcast-message',conectados)
                    }
                } catch (error) {
                    console.log(error);
                }
            });
        },
        disconnect: (io:any,socket: Socket) => {
            socket.on('disconnect', async () => {

                try {
                    console.log(`Desconexión del cliente con ID: ${socket.id}`);
                    // Eliminar Socket Desconectado
                    let result = await mongo.db.collection('sockets').findOne({socketId: socket.id});
                    console.log(result);
                    if(result){
                        if(result.socketId.length>1)
                            {
                                await mongo.db.collection('sockets').findOneAndUpdate(
                                    {_id:result._id},
                                    { $pull: { socketId: socket.id } },
                                    { multi: true }
                                )
                            }
                        else{
                            await mongo.db.collection('sockets').deleteOne({_id:result._id});
                        }
                        const conectados = await mongo.db.collection('sockets').find({}).toArray();
                        io.emit('broadcast-message',conectados)
                    }
                } catch (error) {
                    console.log(error);
                }
                // TO DO: Guardar Log en Base de Datos
            });
        }
    }
};