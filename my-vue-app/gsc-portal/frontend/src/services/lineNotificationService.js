import axios from 'axios'
import { LINE_MESSAGE_TEMPLATES } from '../constants/timetable'

class LineNotificationService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL
    this.lineEndpoint = '/notifications/line'
  }

  /**
   * LINE 메시지 전송
   * @param {string} eventType - 이벤트 타입 (cancel, makeup, special)
   * @param {Object} eventData - 이벤트 데이터
   * @param {Array} recipients - 수신자 목록
   */
  async sendNotification(eventType, eventData, recipients) {
    try {
      // 메시지 템플릿 가져오기
      const messageTemplate = LINE_MESSAGE_TEMPLATES[eventType]
      if (!messageTemplate) {
        throw new Error(`Unknown event type: ${eventType}`)
      }

      // 이벤트 데이터에 URL 추가
      const eventUrl = `${window.location.origin}/schedule/${eventData.id}`
      const messageData = {
        ...eventData,
        url: eventUrl
      }

      // 메시지 생성
      const message = messageTemplate(messageData)

      // API 호출
      const response = await axios.post(`${this.baseURL}${this.lineEndpoint}`, {
        message,
        recipients,
        eventType,
        eventId: eventData.id
      })

      console.log('📱 LINE 알림 전송 성공:', response.data)
      return response.data

    } catch (error) {
      console.error('❌ LINE 알림 전송 실패:', error)
      throw error
    }
  }

  /**
   * 대상자 목록 조회
   * @param {Object} filters - 필터 조건 (year, level, targetType)
   */
  async getRecipients(filters) {
    try {
      const response = await axios.get(`${this.baseURL}/users/line-recipients`, {
        params: filters
      })
      return response.data

    } catch (error) {
      console.error('❌ 수신자 목록 조회 실패:', error)
      throw error
    }
  }
}

export default new LineNotificationService() 