#!/usr/bin/env python3
"""Convenience wrapper for the local dev proxy.

The actual implementation lives in local/proxy_server.py.
This wrapper exists so the repo can be run from the root as:

  python3 proxy_server.py 8001
"""

from __future__ import annotations

import os
import runpy


def main():
    repo_root = os.path.dirname(os.path.abspath(__file__))
    runpy.run_path(os.path.join(repo_root, "local", "proxy_server.py"), run_name="__main__")


if __name__ == "__main__":
    main()
