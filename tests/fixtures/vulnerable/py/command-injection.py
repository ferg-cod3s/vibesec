# Test fixture: Command injection
# Should trigger: command-injection

import os
import subprocess

def ping_host(host):
    os.system(f"ping -c 1 {host}")

def process_file(filename):
    subprocess.run(f"cat {filename}", shell=True)

def backup_data(path):
    os.system(f"tar -czf backup.tar.gz {path}")
