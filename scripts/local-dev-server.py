#!/usr/bin/env python3
"""Serve Ledger.html with a local Google Apps Script mock for Cloud Agent development."""

from __future__ import annotations

import argparse
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEDGER_HTML = ROOT / "Ledger.html"
GAS_MOCK_JS = Path(__file__).resolve().parent / "gas-mock.js"
INJECTION = f'<script src="/scripts/gas-mock.js"></script>\n'


class LedgerHandler(BaseHTTPRequestHandler):
    server_version = "LedgerDev/1.0"

    def log_message(self, fmt: str, *args) -> None:
        print(f"[ledger-dev] {self.address_string()} - {fmt % args}")

    def _send(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        path = self.path.split("?", 1)[0]

        if path in ("/", "/index.html", "/Ledger.html"):
            if not LEDGER_HTML.is_file():
                self._send(404, b"Ledger.html not found", "text/plain; charset=utf-8")
                return
            html = LEDGER_HTML.read_text(encoding="utf-8")
            if INJECTION.strip() not in html:
                marker = "<head>"
                if marker in html:
                    html = html.replace(marker, marker + "\n" + INJECTION, 1)
                else:
                    html = INJECTION + html
            self._send(200, html.encode("utf-8"), "text/html; charset=utf-8")
            return

        if path == "/scripts/gas-mock.js":
            if not GAS_MOCK_JS.is_file():
                self._send(404, b"gas-mock.js not found", "text/plain; charset=utf-8")
                return
            body = GAS_MOCK_JS.read_bytes()
            self._send(200, body, "application/javascript; charset=utf-8")
            return

        rel = path.lstrip("/")
        candidate = (ROOT / rel).resolve()
        try:
            candidate.relative_to(ROOT.resolve())
        except ValueError:
            self._send(403, b"Forbidden", "text/plain; charset=utf-8")
            return

        if candidate.is_file():
            content_type, _ = mimetypes.guess_type(str(candidate))
            self._send(200, candidate.read_bytes(), content_type or "application/octet-stream")
            return

        self._send(404, b"Not found", "text/plain; charset=utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ledger local development server")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), LedgerHandler)
    print(f"[ledger-dev] Serving Ledger at http://{args.host}:{args.port}/")
    print("[ledger-dev] Login: admin@ledger.local / Admin123!")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[ledger-dev] Stopped")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
