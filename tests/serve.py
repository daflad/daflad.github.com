# Serves the built site (default: _site) for the browser tests.
# Like "python3 -m http.server", but accepts many connections at once, as browsers open
# them, and answers range requests ("bytes=1000-") as GitHub Pages does, so audio can be
# streamed and skipped through.
import functools
import http.server
import os
import re
import sys

root = sys.argv[1] if len(sys.argv) > 1 else "_site"
port = int(sys.argv[2]) if len(sys.argv) > 2 else 4173


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def send_head(self):
        self._range = None
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", self.headers.get("Range", "").strip())
        path = self.translate_path(self.path)
        if not match or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        start, end = match.groups()
        if start:
            start, end = int(start), min(int(end) if end else size - 1, size - 1)
        else:  # "bytes=-500": the last 500 bytes
            start, end = max(size - int(end or 0), 0), size - 1
        if start > end or start >= size:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None
        f = open(path, "rb")
        f.seek(start)
        self._range = end - start + 1
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(self._range))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        return f

    def copyfile(self, source, outputfile):
        if not getattr(self, "_range", None):
            return super().copyfile(source, outputfile)
        left = self._range
        while left > 0:
            chunk = source.read(min(64 * 1024, left))
            if not chunk:
                break
            outputfile.write(chunk)
            left -= len(chunk)

    def end_headers(self):
        if not getattr(self, "_range", None) and self.command in ("GET", "HEAD"):
            self.send_header("Accept-Ranges", "bytes")
        super().end_headers()


handler = functools.partial(Handler, directory=root)
with Server(("127.0.0.1", port), handler) as httpd:
    httpd.serve_forever()
