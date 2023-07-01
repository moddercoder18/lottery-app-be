import {DocumentBuilder} from "@nestjs/swagger";

import {setupSwaggerDocument} from "../common/swagger";

export default setupSwaggerDocument(
  "page-content",
  new DocumentBuilder()
    .setTitle("Authorization Docs")
    .setDescription("Basic page-content authorization features")
    .setVersion("1.0")
    .setBasePath("api")
    .addTag("page-content")
    .addTag("page-content")
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: process.env.DEFAULT_TOKEN || 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .build(),
);
