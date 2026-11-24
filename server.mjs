
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("dist");
const port = Number(
  process.env.X_ZOHO_CATALYST_LISTEN_PORT ||
  process.env.PORT ||
  9000
);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml"
};

const server = http.createServer((req, res) => {
  let pathname;

  try {
    pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname
    );
  } catch {
    res.writeHead(400);
    return res.end("Bad Request");
  }

  const requestedPath = path.resolve(
    root,
    "." + pathname
  );

  if (
    requestedPath !== root &&
    !requestedPath.startsWith(root + path.sep)
  ) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(requestedPath, (err, stats) => {
    let filePath = requestedPath;

    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.stat(filePath, (fileErr, fileStats) => {
      if (fileErr || !fileStats.isFile()) {
        // Let React Router handle application routes,
        // but don't hide missing static assets.
        if (pathname.startsWith("/assets/")) {
          res.writeHead(404);
          return res.end("Not Found");
        }

        filePath = path.join(root, "index.html");
      }

      const contentType =
        mimeTypes[path.extname(filePath).toLowerCase()] ||
        "application/octet-stream";

      res.writeHead(200, {
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff"
      });

      if (req.method === "HEAD") {
        return res.end();
      }

      fs.createReadStream(filePath)
        .on("error", () => {
          if (!res.headersSent) res.writeHead(500);
          res.end("Internal Server Error");
        })
        .pipe(res);
    });
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`KopMaza server listening on port ${port}`);
});
