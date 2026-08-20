import { Request, Response, Router } from "express";
import swaggerUi from "swagger-ui-express";
import openApiDocument from "../docs/openapi";

const router = Router();

// raw spec, useful for client generation and for importing into Postman
router.get("/api/v1/docs.json", (_req: Request, res: Response) => {
  res.status(200).json(openApiDocument);
});

router.use(
  "/api/v1/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: "HTX THA API docs",
  })
);

export default router;
