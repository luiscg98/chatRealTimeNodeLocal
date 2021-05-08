"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const env_1 = __importDefault(require("../enviroments/env"));
const app = express_1.default();
app.use(express_1.default.json());
app.use(compression_1.default());
app.use(cors_1.default({ origin: true, credentials: true }));
let whiteList = [
    'http://localhost:4200',
    'http://www.midominio.com'
];
app.use(cors_1.default({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (whiteList.indexOf(origin) === -1) {
            var message = 'The CORS policy for this origin doesnt allow access from the particular origin';
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));
app.get('/', (req, res) => {
    res.status(200).json({
        ok: true,
        msg: 'API Real-Time funcionando correctamente'
    });
});
app.listen(env_1.default.API.PORT, () => {
    console.log(`Servidor express funcionando correctamente en el puerto ${env_1.default.API.PORT}`);
});
