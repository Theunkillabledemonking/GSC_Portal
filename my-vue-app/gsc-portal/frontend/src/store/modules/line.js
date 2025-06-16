// ✅ lineStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/services/apiClient'
import { useLineSocketStore } from '@/store'
import { requestLineAuthCode } from '@/services/lineService'

export const useLineStore = defineStore('line', () => {
  // 상태 정의
  const isLinked = ref(false)
  const loading = ref(false)
  const error = ref(null)
  const authCode = ref(null)

  // 액션 정의
  async function requestAuthCode(userId) {
    loading.value = true
    error.value = null
    try {
      const response = await requestLineAuthCode(userId)
      authCode.value = response.code
      return response
    } catch (err) {
      error.value = err.message || 'Failed to request auth code'
      console.error('Error requesting auth code:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function checkLineStatus() {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.get('/line/status')
      isLinked.value = response.data.isLinked
      return response.data
    } catch (err) {
      error.value = err.message || 'Failed to check LINE status'
      console.error('Error checking LINE status:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function linkLine() {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.post('/line/link')
      const lineSocketStore = useLineSocketStore()
      lineSocketStore.initSocket(response.data.userId)
      return response.data.url
    } catch (err) {
      error.value = err.message || 'Failed to link LINE'
      console.error('Error linking LINE:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function unlinkLine() {
    loading.value = true
    error.value = null

    try {
      await apiClient.post('/line/unlink')
      isLinked.value = false
      const lineSocketStore = useLineSocketStore()
      lineSocketStore.resetState()
    } catch (err) {
      error.value = err.message || 'Failed to unlink LINE'
      console.error('Error unlinking LINE:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function sendNotification(userId, message) {
    loading.value = true
    error.value = null

    try {
      await apiClient.post('/line/notify', {
        userId,
        message
      })
    } catch (err) {
      error.value = err.message || 'Failed to send LINE notification'
      console.error('Error sending LINE notification:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function sendBulkNotification(userIds, message) {
    loading.value = true
    error.value = null

    try {
      await apiClient.post('/line/notify/bulk', {
        userIds,
        message
      })
    } catch (err) {
      error.value = err.message || 'Failed to send bulk LINE notifications'
      console.error('Error sending bulk LINE notifications:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // 상태
    isLinked,
    loading,
    error,
    authCode,
    
    // 액션
    requestAuthCode,
    checkLineStatus,
    linkLine,
    unlinkLine,
    sendNotification,
    sendBulkNotification
  }
})