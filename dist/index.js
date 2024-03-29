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
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const mongo_helper_1 = __importDefault(require("./helpers/mongo.helper"));
const sockets_logic_1 = __importDefault(require("./sockets/sockets.logic"));
const env_1 = __importDefault(require("./enviroments/env"));
const token_helper_1 = __importDefault(require("./helpers/token.helper"));
const index_1 = __importDefault(require("./routes/index"));
const mongo = mongo_helper_1.default.getInstance(env_1.default.MONGODB, true);
const tokenHelper = token_helper_1.default(env_1.default, mongo);
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield mongo.connect(env_1.default.MONGODB.DATABASE);
    if (mongo.statusConnection.status == 'success') {
        console.log(`Conexión exitosa a MonngoDB en el puerto ${env_1.default.MONGODB.PORT}`);
        // Correr Express
        const app = express_1.default();
        app.use(express_1.default.json());
        app.use(compression_1.default());
        let whitelist = [
            'http://angular.midomio.com'
        ];
        app.use(cors_1.default({ origin: true, credentials: true }));
        //app.use(cors({origin: true, credentials: true}));
        app.get('/', (req, res) => {
            res.status(200).json({
                ok: true,
                msg: 'API Real-Time funcionando correctamente'
            });
        });
        app.use('/api', index_1.default);
        /*app.post('/loginOAuth2', async (req: Request, res: Response) => {
            const { correo, apiKey } = req.body;

            console.log('Evaluar REQ.BODY =======>', correo);

            const response: any = await mongo.db.collection('usuarios')
                .findOne(
                    { correo, isVerify: true },
                    { projection: { _id: 0, correo: 1, fotoURL: 1, nombreCompleto: 1}}
                )
                .then((result: any) => {

                    console.log('EVALUAR RESULT =====>', result);

                    if (!result) {
                        return {
                            ok: false,
                            code: 404,
                            msg: `Lo sentimos, el usuario ${correo} no se ha registrado aún o bien no ha habilitado su acceso`
                        }
                    }
                    return {
                        ok: true,
                        code: 200,
                        msg: `Inicio de sesión realizado de forma exitosa para el usuario ${correo}`,
                        result
                    }
                })
                .catch((error: any) => {
                    return {
                        ok: false,
                        code: 500,
                        msg: `Ocurrio un error no contemplado al intentar inicar sesión con el usuario ${correo}`,
                        error
                    }
                });


            console.log('ERROR LOGIN =========>', response);
            
            if (response.ok == false) {
                res.status(response.code).json(response);
            } else {
                // Solicitar Token para usuario
                const token: any = await tokenHelper.create(response.result, apiKey);
                res.status(response.code).json(token);
            }
        })*/
        const httpServer = http_1.default.createServer(app);
        const socketIO = require('socket.io')(httpServer, {
            cors: {
                origin: ["http://angular.midominio.com", "http://localhost:4200"]
            },
            allowEIO3: true
        });
        // Funcionalidad Real-Time
        const socketLogic = sockets_logic_1.default(mongo);
        socketIO.on('connection', (socket) => {
            // TO DO: Lógica Real-Time
            console.log(`Nuevo cliente conectado con ID: ${socket.id}`);
            // Socket Connect
            //socketLogic.listenSocketConnect(socket);
            //socketLogic.conecciones(socketIO,socket);
            //actualizar
            socketLogic.actualizarCorreo(socketIO, socket);
            socketLogic.logOut(socketIO, socket);
            // Logic SignUp
            socketLogic.signIn(socketIO, socket);
            // Logic Disconnect
            socketLogic.disconnect(socketIO, socket);
        });
        httpServer.listen(env_1.default.API.PORT, () => {
            console.log(`Servidor Express funcionando correctamente en puerto ${env_1.default.API.PORT}`);
        });
    }
    else {
        console.log('No se pudo establecer conexión co la base de datos');
    }
}))();
// Handle Errors 
process.on('unhandleRejection', (error, promise) => {
    console.log(`Ocurrio un error no controlado de tipo promise rejection`, promise);
    console.log(`La descripción de error es la siguiente`, error);
    // Close MongoDB
    mongo.close();
    process.exit();
});
