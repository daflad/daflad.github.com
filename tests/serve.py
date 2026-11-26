# Serves the built site (default: _site) for the browser tests.
# Like "python3 -m http.server", but accepts many connections at once, as browsers open them.
import functools
import http.server
import sys

root = sys.argv[1] if len(sys.argv) > 1 else "_site"
port = int(sys.argv[2]) if len(sys.argv) > 2 else 4173


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


handler = functools.partial(Quiet, directory=root)
with Server(("127.0.0.1", port), handler) as httpd:
    httpd.serve_forever()
