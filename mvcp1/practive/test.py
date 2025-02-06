import struct

foo = 3.18

foo_byte = struct.pack('f', foo)
print(f"['foo_byte] : {foo_byte}")

bar = "hello"

print(f"[bar] : {type(bar)}")
print(f"encoded bar : {type(bar.encode('utf-8'))}")