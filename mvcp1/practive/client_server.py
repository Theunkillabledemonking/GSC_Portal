# test_client.py

import socket

# socket 생성 (IPv4 or IPv6, TCP or UDP)
clinet_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# connect (서버 주소, 서버 포트)
clinet_socket.connect(('127.0.0.1', 5500))


