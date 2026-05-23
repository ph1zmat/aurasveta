import ssh_probe
import sys

cmd = "su - aurasveta -s /bin/bash -c \"cd /var/www/aurasveta/current && export NODE_OPTIONS='--max-old-space-size=2048' && npm run build\""
print("Running command on VPS...")
out, err = ssh_probe.run(cmd, timeout=1800)
print("STDOUT:")
print(out)
print("STDERR:")
print(err)
