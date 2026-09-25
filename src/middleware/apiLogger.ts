import type { Request, Response, NextFunction } from "express";

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

function colorStatus(status: number): string {
  if (status >= 500) return `${COLORS.red}${status}${COLORS.reset}`;
  if (status >= 400) return `${COLORS.yellow}${status}${COLORS.reset}`;
  if (status >= 300) return `${COLORS.cyan}${status}${COLORS.reset}`;
  return `${COLORS.green}${status}${COLORS.reset}`;
}

function colorMethod(method: string): string {
  const m = method.toUpperCase();
  if (m === "GET") return `${COLORS.green}${m}${COLORS.reset}`;
  if (m === "POST") return `${COLORS.yellow}${m}${COLORS.reset}`;
  if (m === "PUT") return `${COLORS.blue}${m}${COLORS.reset}`;
  if (m === "DELETE") return `${COLORS.red}${m}${COLORS.reset}`;
  if (m === "PATCH") return `${COLORS.magenta}${m}${COLORS.reset}`;
  return `${COLORS.cyan}${m}${COLORS.reset}`;
}

function truncate(value: string, max = 300): string {
  if (value.length <= max) return value;
  return value.slice(0, max) + `... [truncated ${value.length - max} chars]`;
}

function safeStringify(obj: any): string {
  try {
    let str = JSON.stringify(obj);
    // Avoid logging huge base64 images in full
    if (str.length > 1200) {
      const copy = { ...obj };
      for (const k of ["imageBase64", "image", "imageUrl", "avatar"]) {
        if (typeof copy[k] === "string" && copy[k].length > 200) {
          copy[k] = copy[k].slice(0, 80) + `... [${copy[k].length} chars base64/image truncated]`;
        }
      }
      str = JSON.stringify(copy);
    }
    return truncate(str, 800);
  } catch {
    return "[unserializable body]";
  }
}

export function apiLogger(req: Request, res: Response, next: NextFunction) {
  // Only log API hits
  if (!req.originalUrl.startsWith("/api")) {
    return next();
  }

  const start = Date.now();
  const startTime = new Date().toISOString();
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || req.socket.remoteAddress || "-";
  const userAgent = (req.headers["user-agent"] || "-").slice(0, 120);

  // Log incoming (dim)
  const queryStr = Object.keys(req.query).length ? ` query=${safeStringify(req.query)}` : "";
  const bodyStr = req.body && Object.keys(req.body).length
    ? ` body=${safeStringify(req.body)}`
    : "";

  console.log(
    `${COLORS.dim}→ [API] ${startTime} ${colorMethod(req.method)} ${COLORS.cyan}${req.originalUrl}${COLORS.reset}${COLORS.dim} from ${ip}${COLORS.reset}`
  );
  if (queryStr || bodyStr) {
    console.log(`${COLORS.gray}  ${queryStr}${bodyStr}${COLORS.reset}`);
  }

  // Monkey-patch res.json to capture response size (optional)
  let responseBodyLength = 0;
  const originalJson = res.json.bind(res);
  (res as any).json = (body: any) => {
    try {
      responseBodyLength = JSON.stringify(body)?.length || 0;
    } catch {}
    return originalJson(body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = colorStatus(res.statusCode);
    const durationColor = duration > 1000 ? COLORS.red : duration > 300 ? COLORS.yellow : COLORS.green;
    const sizeInfo = responseBodyLength ? ` ${COLORS.dim}${(responseBodyLength / 1024).toFixed(1)}kb${COLORS.reset}` : "";

    console.log(
      `${COLORS.dim}← [API] ${new Date().toISOString()} ${colorMethod(req.method)} ${COLORS.cyan}${req.originalUrl}${COLORS.reset} ${status} ${durationColor}${duration}ms${COLORS.reset}${sizeInfo} ${COLORS.dim}ua:${userAgent}${COLORS.reset}`
    );
  });

  next();
}
