import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './env';
import { version } from '../../../package.json';

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Tourist Safety API',
            version,
            description: 'API documentation for the Tourist Safety Monitoring System',
            contact: {
                name: 'API Support',
                email: 'support@touristsafety.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: `${config.serverUrl}/api/v1`,
                description: `${config.isProduction ? 'Production' : 'Development'} server`,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            responses: {
                UnauthorizedError: {
                    description: 'Access token is missing or invalid',
                },
                ValidationError: {
                    description: 'Request validation failed',
                },
                ServerError: {
                    description: 'Internal server error',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.types.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
export { swaggerUi };