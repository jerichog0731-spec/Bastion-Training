import subprocess
import sys

try:
    import jupyterlab
    print("jupyterlab found")
except ImportError:
    print("jupyterlab NOT found")
