import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io } from 'socket.io-client'

export const useLineSocketStore = defineStore('lineSocket', () => {
  const socket = ref(null)
  const message = ref('')
  const isConnected = ref(false)

  const initSocket = (userId) => {
    if (!userId) return

    socket.value = io('http://localhost:5000', {
      query: { userId }
    })

    socket.value.on('connect', () => {
      console.log('🔌 Socket connected!')
      isConnected.value = true
    })

    socket.value.on('line_auth_success', (data) => {
      message.value = '✅ LINE 연동이 완료되었습니다!'
      console.log('Line auth success:', data)
    })

    socket.value.on('disconnect', () => {
      console.log('Socket disconnected')
      isConnected.value = false
    })
  }

  const resetState = () => {
    if (socket.value) {
      socket.value.disconnect()
    }
    socket.value = null
    message.value = ''
    isConnected.value = false
  }

  return {
    socket,
    message,
    isConnected,
    initSocket,
    resetState
  }
}) 