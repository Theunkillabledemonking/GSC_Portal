const CACHE_PREFIX = 'timetable_'
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes

/**
 * 캐시 키 생성
 * @param {string} type - 캐시 유형
 * @param {Object|string} value - 캐시 값 또는 파라미터 객체
 * @returns {string} 생성된 캐시 키
 */
export function getCacheKey(type, value) {
  // 값이 객체인 경우 처리
  if (value && typeof value === 'object') {
    const paramString = Object.entries(value)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('&')
    return `${CACHE_PREFIX}${type}_${paramString}` 
  }
  
  // 일반 문자열인 경우
  return `${CACHE_PREFIX}${type}_${value}`
}

/**
 * 캐시에 데이터 저장
 * @param {string} key - 캐시 키
 * @param {any} data - 저장할 데이터
 * @param {number} [expiry] - 캐시 만료 시간(ms), 기본값 사용 시 생략 가능
 */
export function setCache(key, data, expiry) {
  const cacheData = {
    data,
    timestamp: Date.now(),
    expiry: expiry || CACHE_EXPIRY // 기본값 사용 또는 사용자 지정 값
  }
  localStorage.setItem(key, JSON.stringify(cacheData))
}

/**
 * 캐시에서 데이터 조회
 * @param {string} key - 캐시 키
 * @returns {any|null} 캐시된 데이터 또는 null
 */
export function getCache(key) {
  const cached = localStorage.getItem(key)
  if (!cached) return null
  
  try {
    const { data, timestamp, expiry = CACHE_EXPIRY } = JSON.parse(cached)
    if (Date.now() - timestamp > expiry) {
      localStorage.removeItem(key)
      return null
    }
    
    return data
  } catch (error) {
    console.warn('Cache read error:', error)
    localStorage.removeItem(key)
    return null
  }
}

/**
 * 모든 캐시 초기화
 */
export function clearCache() {
  Object.keys(localStorage)
    .filter(key => key.startsWith(CACHE_PREFIX))
    .forEach(key => localStorage.removeItem(key))
}

/**
 * 캐시 유효성 검사
 * @param {string} key - 캐시 키
 * @returns {boolean} 캐시가 유효한지 여부
 */
export function isCacheValid(key) {
  const cached = localStorage.getItem(key)
  if (!cached) return false
  
  const { timestamp } = JSON.parse(cached)
  return Date.now() - timestamp <= CACHE_EXPIRY
} 