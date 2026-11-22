import express, { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { buildSwaggerDocument } from "./docs/swagger";
import alunosRouter from "./domains/alunos/alunos.routes";
import cursosRouter from "./domains/cursos/cursos.routes";
import disciplinasRouter from "./domains/disciplinas/disciplinas.routes";
import loginRouter from "./domains/login/login.routes";
import matriculasRouter from "./domains/matriculas/matriculas.routes";
import meRouter from "./domains/me/me.routes";
import ofertasRouter from "./domains/ofertas/ofertas.routes";
import professoresRouter from "./domains/professores/professores.routes";
import progressoRouter from "./domains/progresso/progresso.routes";
import turmasRouter from "./domains/turmas/turmas.routes";
import { corsMiddleware } from "./middlewares/cors.middleware";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware";

const app: Express = express();

app.use(corsMiddleware);
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  return res.status(200).send({
    message: "Hello World!",
  });
});

app.get("/health", (_req: Request, res: Response) => {
  return res.status(200).json({ status: "ok" });
});

const swaggerDocument = buildSwaggerDocument();
const swaggerUiOptions = {
  customSiteTitle: "Sistema de Matrícula — API Docs",
  swaggerOptions: {
    docExpansion: "list",
    filter: true,
    persistAuthorization: true,
    displayRequestDuration: true,
    defaultModelsExpandDepth: -1,
  },
  customCss: `
    body {
      background: #0b1120;
      margin: 0;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #e2e8f0;
    }
    .swagger-ui {
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #e2e8f0;
    }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .wrapper { max-width: 1140px; padding: 32px 24px 72px; }

    /* Info Header Card */
    .swagger-ui .info {
      background: linear-gradient(135deg, #111827 0%, #0f172a 100%);
      border: 1px solid #1e293b;
      border-top: 4px solid #6366f1;
      border-radius: 16px;
      padding: 28px 32px;
      margin: 0 0 24px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }
    .swagger-ui .info .title {
      color: #f8fafc;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .swagger-ui .info .title small {
      background: rgba(99, 102, 241, 0.16);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.35);
      border-radius: 9999px;
      padding: 2px 10px;
      font-size: 12px;
      font-weight: 600;
      top: 0;
    }
    .swagger-ui .info .title small.version-stamp {
      background: rgba(16, 185, 129, 0.16);
      color: #6ee7b7;
      border-color: rgba(16, 185, 129, 0.35);
    }
    .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info .base-url {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
    }
    .swagger-ui .info a { color: #818cf8; text-decoration: none; font-weight: 500; }
    .swagger-ui .info a:hover { text-decoration: underline; }
    .swagger-ui .info .markdown pre {
      background: #020617;
      color: #e2e8f0;
      border: 1px solid #1e293b;
      border-radius: 10px;
      padding: 14px 16px;
      font-family: "JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 13px;
      overflow-x: auto;
    }

    /* Auth & Scheme Bar */
    .swagger-ui .scheme-container {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      padding: 16px 24px;
      margin-bottom: 24px;
    }
    .swagger-ui .schemes > label { color: #cbd5e1; }
    .swagger-ui select {
      background: #0f172a;
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 8px;
    }
    .swagger-ui .btn {
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.15s ease;
    }
    .swagger-ui .btn.authorize {
      background: #6366f1;
      color: #ffffff;
      border-color: #6366f1;
      padding: 8px 16px;
      box-shadow: 0 2px 6px rgba(99, 102, 241, 0.35);
    }
    .swagger-ui .btn.authorize:hover { background: #4f46e5; border-color: #4f46e5; }
    .swagger-ui .btn.authorize svg { fill: #ffffff; }
    .swagger-ui .btn.execute {
      background: #6366f1;
      border-color: #6366f1;
      color: #ffffff;
    }
    .swagger-ui .btn.execute:hover { background: #4f46e5; border-color: #4f46e5; }
    .swagger-ui .btn.cancel {
      background: #1e293b;
      border-color: #334155;
      color: #cbd5e1;
    }

    /* Filter Input */
    .swagger-ui .filter-container { margin: 0 0 20px; padding: 0; }
    .swagger-ui .filter-container .operation-filter-input {
      background: #111827;
      color: #f8fafc;
      border-radius: 12px;
      border: 1px solid #334155;
      padding: 10px 14px;
      font-size: 14px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .swagger-ui .filter-container .operation-filter-input::placeholder { color: #64748b; }
    .swagger-ui .filter-container .operation-filter-input:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
    }

    /* Tag Sections */
    .swagger-ui .opblock-tag-section { margin-bottom: 16px; }
    .swagger-ui .opblock-tag {
      border-bottom: 1px solid #1e293b;
      font-size: 18px;
      font-weight: 700;
      color: #f8fafc;
      padding: 12px 6px;
      margin-bottom: 10px;
    }
    .swagger-ui .opblock-tag small { color: #94a3b8; }
    .swagger-ui .opblock-tag:hover { background: rgba(30, 41, 59, 0.5); border-radius: 8px; }
    .swagger-ui .opblock-tag svg { fill: #94a3b8; }

    /* Operation Cards */
    .swagger-ui .opblock {
      border-radius: 12px;
      border-width: 1px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
      margin-bottom: 10px;
      overflow: hidden;
      transition: box-shadow 0.15s ease;
    }
    .swagger-ui .opblock:hover { box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35); }
    .swagger-ui .opblock .opblock-summary { padding: 8px 14px; }
    .swagger-ui .opblock .opblock-summary-method {
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      min-width: 72px;
      padding: 6px 10px;
      letter-spacing: 0.03em;
    }
    .swagger-ui .opblock .opblock-summary-path {
      font-family: "JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 13.5px;
      font-weight: 600;
      color: #f8fafc;
    }
    .swagger-ui .opblock .opblock-summary-description { color: #94a3b8; font-size: 13px; }
    .swagger-ui .opblock .opblock-summary svg { fill: #94a3b8; }

    /* Method Colors (Dark) */
    .swagger-ui .opblock.opblock-get { background: rgba(14, 165, 233, 0.08); border-color: rgba(56, 189, 248, 0.3); }
    .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #0284c7; }
    .swagger-ui .opblock.opblock-post { background: rgba(16, 185, 129, 0.08); border-color: rgba(52, 211, 153, 0.3); }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #059669; }
    .swagger-ui .opblock.opblock-put,
    .swagger-ui .opblock.opblock-patch { background: rgba(245, 158, 11, 0.08); border-color: rgba(251, 191, 36, 0.3); }
    .swagger-ui .opblock.opblock-put .opblock-summary-method,
    .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #d97706; }
    .swagger-ui .opblock.opblock-delete { background: rgba(244, 63, 94, 0.08); border-color: rgba(251, 113, 133, 0.3); }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #e11d48; }

    /* Expanded Operation Body, Tables & Inputs */
    .swagger-ui .opblock .opblock-section-header {
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      box-shadow: none;
    }
    .swagger-ui .opblock .opblock-section-header h4,
    .swagger-ui .opblock-description-wrapper p,
    .swagger-ui .parameter__name,
    .swagger-ui .parameter__type,
    .swagger-ui .response-col_status,
    .swagger-ui .response-col_description p,
    .swagger-ui .tab li { color: #e2e8f0; }
    .swagger-ui .parameter__in,
    .swagger-ui .responses-inner h4,
    .swagger-ui .responses-inner h5 { color: #94a3b8; }
    .swagger-ui table thead tr th,
    .swagger-ui table thead tr td {
      color: #94a3b8;
      border-bottom: 1px solid #1e293b;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .swagger-ui table tbody tr td { border-bottom: 1px solid #1e293b; color: #cbd5e1; }
    .swagger-ui input[type=text],
    .swagger-ui input[type=password],
    .swagger-ui input[type=email],
    .swagger-ui textarea {
      background: #020617;
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 8px;
    }

    /* Code & Modals */
    .swagger-ui .highlight-code pre,
    .swagger-ui .microlight {
      background: #020617 !important;
      color: #e2e8f0 !important;
      border: 1px solid #1e293b;
      border-radius: 10px;
      padding: 14px !important;
      font-family: "JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace !important;
      font-size: 12.5px !important;
    }
    .swagger-ui .dialog-ux .modal-ux {
      background: #111827;
      color: #e2e8f0;
      border-radius: 16px;
      border: 1px solid #1e293b;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
    }
    .swagger-ui .dialog-ux .modal-ux-header { border-bottom: 1px solid #1e293b; }
    .swagger-ui .dialog-ux .modal-ux-header h3,
    .swagger-ui .dialog-ux .modal-ux-content p,
    .swagger-ui .dialog-ux .modal-ux-content h4,
    .swagger-ui .dialog-ux .modal-ux-content label { color: #e2e8f0; }
  `,
};

app.get("/docs.json", (_req: Request, res: Response) => {
  return res.status(200).json(swaggerDocument);
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerUiOptions));

app.use("/auth", loginRouter);
app.use("/auth", meRouter);
app.use("/", loginRouter);
app.use("/", meRouter);
app.use("/", ofertasRouter);
app.use("/", matriculasRouter);
app.use("/", progressoRouter);
app.use("/", cursosRouter);
app.use("/", alunosRouter);
app.use("/", disciplinasRouter);
app.use("/", professoresRouter);
app.use("/", turmasRouter);

app.use(errorHandlerMiddleware);

export default app;
