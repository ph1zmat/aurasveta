import socket
import select
import threading
import paramiko
import sys

HOST = "87.232.65.84"
USER = "root"
PASS = "aP3}qb6-pD"
SSH_PORT = 22
LOCAL_PORT = 5433
REMOTE_BIND = ("127.0.0.1", 5432)

def handler(chan, client_socket):
    try:
        while True:
            r, w, x = select.select([chan, client_socket], [], [])
            if chan in r:
                data = chan.recv(4096)
                if len(data) == 0:
                    break
                client_socket.send(data)
            if client_socket in r:
                data = client_socket.recv(4096)
                if len(data) == 0:
                    break
                chan.send(data)
    except Exception as e:
        pass
    finally:
        chan.close()
        client_socket.close()

def tunnel_server():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, username=USER, password=PASS, timeout=30)
    except Exception as e:
        print(f"SSH helper connection failed: {e}")
        sys.exit(1)
    
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server_socket.bind(('127.0.0.1', LOCAL_PORT))
    except Exception as e:
        print(f"Failed to bind local port {LOCAL_PORT}: {e}")
        client.close()
        sys.exit(1)
        
    server_socket.listen(100)
    print(f"LOCAL_PORT_TUNNEL_ACTIVE: 127.0.0.1:{LOCAL_PORT} -> remote {REMOTE_BIND[0]}:{REMOTE_BIND[1]}")
    sys.stdout.flush()
    
    transport = client.get_transport()
    try:
        while True:
            client_socket, addr = server_socket.accept()
            chan = transport.open_channel('direct-tcpip', REMOTE_BIND, addr)
            if chan is None:
                client_socket.close()
                continue
            thr = threading.Thread(target=handler, args=(chan, client_socket))
            thr.daemon = True
            thr.start()
    except KeyboardInterrupt:
        pass
    finally:
        server_socket.close()
        client.close()

if __name__ == "__main__":
    tunnel_server()
