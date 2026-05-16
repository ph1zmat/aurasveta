import paramiko
import sys

HOST = "87.232.65.84"
USER = "root"
PASS = "aP3}qb6-pD"

def run(cmd, timeout=30):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASS, timeout=30, banner_timeout=30, auth_timeout=30)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    client.close()
    return out, err

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ssh_probe.py <command>")
        sys.exit(1)
    cmd = sys.argv[1]
    out, err = run(cmd, timeout=60)
    if err.strip():
        sys.stdout.buffer.write(("STDERR: " + err + "\n").encode('utf-8', errors='replace'))
    sys.stdout.buffer.write((out + "\n").encode('utf-8', errors='replace'))
