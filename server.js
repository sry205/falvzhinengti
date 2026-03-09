import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditText, answerFollowup, ValidationError } from "./src/auditEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(payload);
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw);
}

function serveStatic(req, res) {
  const reqPath = req.url === "/" ? "/index.html" : req.url;
  const normalized = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, normalized);

  if (!filePath.startsWith(publicDir) || !existsSync(filePath)) {
    sendText(res, 404, "Not Found");
    return;
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(res);
}

async function ensurePublicIndex() {
  const indexPath = path.join(publicDir, "index.html");
  await readFile(indexPath, "utf8");
}

export function createAppServer() {
  const audits = new Map();

  return createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === "/api/health") {
        sendJson(res, 200, { ok: true });
        return;
      }

      if (req.method === "POST" && req.url === "/audit/text") {
        const body = await readJsonBody(req);
        const result = auditText(body);
        audits.set(result.audit_id, result);
        sendJson(res, 200, result);
        return;
      }

      if (req.method === "POST" && req.url === "/chat/followup") {
        const body = await readJsonBody(req);
        const audit = audits.get(body.audit_id || body.auditId);

        if (!audit) {
          sendJson(res, 404, {
            error: "audit_not_found",
            message: "未找到对应的审查记录，请先重新提交文本。"
          });
          return;
        }

        const answer = answerFollowup({
          audit,
          question: body.question
        });
        sendJson(res, 200, answer);
        return;
      }

      if (req.method === "GET") {
        serveStatic(req, res);
        return;
      }

      sendText(res, 404, "Not Found");
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJson(res, 400, {
          error: "invalid_json",
          message: "请求体不是合法 JSON。"
        });
        return;
      }

      if (error instanceof ValidationError) {
        sendJson(res, 400, {
          error: "validation_error",
          message: error.message
        });
        return;
      }

      sendJson(res, 500, {
        error: "internal_error",
        message: "服务处理失败。",
        detail: error.message
      });
    }
  });
}

export async function startServer(port = Number(process.env.PORT || 3000)) {
  await ensurePublicIndex();
  const server = createAppServer();

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => resolve(server));
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const port = Number(process.env.PORT || 3000);
  startServer(port)
    .then(() => {
      console.log(`Server running at http://localhost:${port}`);
    })
    .catch((error) => {
      console.error("Failed to start server:", error.message);
      process.exitCode = 1;
    });
}
