import socket

# 서버 설정
HOST = "127.0.0.1" # 서버가 바인딩할 ip 주소 (로컬호스트)
PORT = 5500 # 사용할 포트 번호

# 소켓 생성 (IPv4, TCP 방식)
# TCP : socket.SOCK_STREAM
# UDP : socket.SOCK_DGRAM
server_socket_1 = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# IP 및 포트 바인딩
server_socket_1.bind((HOST,PORT))

# 클라이언트의 접속 요청을 받을 수 있도록 대기 상태 설정
# (최대 5개의 대기 큐 크기 설정)
server_socket_1.listen(5)
print(f"서버가 {HOST}:{PORT}에서 대기 중..")

# accept(), -> 사용자로부터 연결 요청을 받았을 때 -> 새로운 소켓 생성
# accept()는 블로킹 함수
# 클라이언트 -> connect()
client_scoket, client_addr = server_socket_1.accept() # 종료 안하면 무한 루프

print(f"[client ip address] : {client_addr}")

# 클라이언트로 메세지를 수신
rcvd_data = client_scoket.recv(1024) # 비동기? 동기? , 가져오는 데이터의 자료형은 무엇?

print(f"type of rcvd_data: {type(rcvd_data)}")
# 수신한 메시지를 클라이언트로 전송함.
