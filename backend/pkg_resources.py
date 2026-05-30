"""
Light shim for `pkg_resources.resource_filename` used by some third-party
libraries (e.g., older `librosa` modules). This avoids depending on the
`pkg_resources` package at import-time and provides just enough functionality
for resource lookup inside installed packages.

This is intentionally minimal and only implements `resource_filename(package, resource)`.
"""
from __future__ import annotations
import importlib
import importlib.resources as resources
import os


def resource_filename(package: str, resource_name: str) -> str:
    """Return a filesystem path for a package resource.

    Args:
        package: package name (e.g. 'librosa')
        resource_name: relative resource path inside the package

    Returns:
        Filesystem path (string). If the resource cannot be resolved, returns
        the resource_name unchanged.
    """
    try:
        # import the package to ensure it's on sys.path
        importlib.import_module(package)
        # Use importlib.resources to locate the file
        res = resources.files(package).joinpath(resource_name)
        # If it's packaged in a zip/egg, try to extract to a temporary file
        if res.is_file():
            return str(res)
        # If not a file, attempt to read and write to a cache location
        data = resources.files(package).joinpath(resource_name).read_bytes()
        from tempfile import gettempdir
        out = os.path.join(gettempdir(), os.path.basename(resource_name))
        with open(out, "wb") as fh:
            fh.write(data)
        return out
    except Exception:
        return resource_name