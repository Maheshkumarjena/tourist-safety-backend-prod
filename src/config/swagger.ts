// src/config/swagger.ts
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { Application } from 'express';

const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, '../../swagger.json'), 'utf8'));

export const swaggerSetup = (app: Application): void => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};