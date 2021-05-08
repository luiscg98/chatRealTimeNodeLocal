"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const registro_1 = __importDefault(require("./registro"));
const app = express_1.default();
app.use(registro_1.default);
exports.default = app;
