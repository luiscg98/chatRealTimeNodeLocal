import express from 'express';
import clientes from './registro';

const app = express();

app.use(clientes);


export default app;