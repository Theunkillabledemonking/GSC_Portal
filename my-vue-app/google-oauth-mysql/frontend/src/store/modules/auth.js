import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/services/apiClient'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const role = ref(Number(localStorage.getItem('role')) || null)
  const grade = ref(Number(localStorage.getItem('grade')) || null)
  const level = ref(localStorage.getItem('level') || null)

  // Computed
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => role.value === 1)
  const isTeacher = computed(() => role.value === 2)
  const isStudent = computed(() => role.value === 3)
  const status = computed(() => user.value?.status || 0)

  // 초기화 함수
  async function initializeAuth() {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      token.value = savedToken
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        user.value = userData
        role.value = userData.role
        grade.value = userData.grade
        level.value = userData.level
      }
      try {
        await checkAuth()
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        logout()
      }
    }
  }

  // 일반 로그인
  async function login(credentials) {
    try {
      const response = await apiClient.post('/auth/login', credentials)
      const { token: newToken, user: userData } = response.data
      
      // Store in state
      token.value = newToken
      user.value = userData
      role.value = userData.role
      grade.value = userData.grade
      level.value = userData.level

      // Store in localStorage
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('role', userData.role)
      localStorage.setItem('grade', userData.grade)
      localStorage.setItem('level', userData.level)

      return response
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  // OAuth 로그인
  async function oauthLogin(tokenValue, userData) {
    try {
      // Store in state
      token.value = tokenValue
      user.value = userData
      role.value = userData.role
      grade.value = userData.grade
      level.value = userData.level

      // Store in localStorage
      localStorage.setItem('token', tokenValue)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('role', userData.role)
      localStorage.setItem('grade', userData.grade)
      localStorage.setItem('level', userData.level)

      return { success: true, user: userData }
    } catch (error) {
      console.error('OAuth login failed:', error)
      throw error
    }
  }

  async function register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData)
      return response
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  function logout() {
    // Clear state
    token.value = null
    user.value = null
    role.value = null
    grade.value = null
    level.value = null

    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('role')
    localStorage.removeItem('grade')
    localStorage.removeItem('level')
  }

  async function checkAuth() {
    if (!token.value) return false
    try {
      const response = await apiClient.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
      
      if (response.data.user) {
        user.value = response.data.user
        role.value = response.data.user.role
        grade.value = response.data.user.grade
        level.value = response.data.user.level
        return true
      }
      return false
    } catch (error) {
      console.error('Auth check failed:', error)
      logout()
      return false
    }
  }

  return {
    // State
    token,
    user,
    role,
    grade,
    level,
    // Computed
    isLoggedIn,
    isAdmin,
    isTeacher,
    isStudent,
    status,
    // Methods
    login,
    oauthLogin,
    register,
    logout,
    checkAuth,
    initializeAuth
  }
})
