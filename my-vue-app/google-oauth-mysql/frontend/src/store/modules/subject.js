import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/services/apiClient'
import { SUBJECT_TYPES } from '@/constants/timetable'

export const useSubjectStore = defineStore('subject', () => {
  // 상태 정의
  const subjects = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 계산된 속성
  const koreanSubjects = computed(() =>
      subjects.value.filter(subject =>
          SUBJECT_TYPES.KOREAN_REGULAR.includes(subject.type)
      )
  )

  const foreignSubjects = computed(() =>
      subjects.value.filter(subject =>
          SUBJECT_TYPES.FOREIGN_REGULAR.includes(subject.type)
      )
  )

  const specialSubjects = computed(() =>
      subjects.value.filter(subject =>
          SUBJECT_TYPES.SPECIAL.includes(subject.type)
      )
  )

  // 학년별 과목 필터링 (정규 수업용)
  const getSubjectsByGrade = (grade) => {
    if (!grade) return []
    return subjects.value.filter(subject => 
      subject.year == grade && subject.is_special_lecture === false
    )
  }

  // 레벨별 과목 필터링 (특강용 또는 TOPIK용)
  const getSubjectsByLevel = (level, isForeigner = null) => {
    if (!level) return []
    
    return subjects.value.filter(subject => {
      // 특강 여부 확인
      const isSpecial = subject.is_special_lecture === true
      
      // 레벨 매칭 확인
      const levelMatches = subject.level === level
      
      // 외국인 대상 여부 확인 (null이면 무시)
      const foreignerTargetMatches = isForeigner === null || 
        subject.is_foreigner_target === isForeigner
      
      // TOPIK 수업인 경우 TOPIK4 또는 TOPIK6 값과 직접 비교
      if (isForeigner && (level === 'TOPIK4' || level === 'TOPIK6')) {
        return levelMatches && foreignerTargetMatches
      }
      
      // JLPT 특강인 경우
      if (isSpecial && (level === 'N1' || level === 'N2' || level === 'N3')) {
        return levelMatches && foreignerTargetMatches
      }
      
      return isSpecial && levelMatches && foreignerTargetMatches
    })
  }

  // 사용자 유형에 맞는 과목 가져오기
  const getSubjectsByUserType = (isForeigner, grade, level = null) => {
    if (isForeigner) {
      // 외국인 학생은 한국어 정규 수업 + 레벨에 맞는 특강
      const regularSubjects = subjects.value.filter(subject => 
        subject.year == grade && 
        subject.is_special_lecture === false && 
        subject.is_foreigner_target === true && 
        (subject.level === 'TOPIK4' || subject.level === 'TOPIK6')
      )
      
      // 사용자 레벨이 지정된 경우 해당 레벨 과목만 필터링 (TOPIK4 또는 TOPIK6)
      const filteredByLevel = level ? 
        regularSubjects.filter(subject => subject.level === level) : 
        regularSubjects
      
      return filteredByLevel
    } else {
      // 한국인 학생은 일본어 특강(JLPT)만
      const specialByLevel = level ? getSubjectsByLevel(level, false) : []
      
      // 전체 대상 과목 (level, is_foreigner_target이 null)
      const commonSubjects = subjects.value.filter(subject => 
        subject.level === null && subject.is_foreigner_target === null
      )
      
      return [...specialByLevel, ...commonSubjects]
    }
  }

  // 액션
  async function fetchSubjects() {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.get('/subjects')
      subjects.value = response.data.subjects;
    } catch (err) {
      error.value = err.message || 'Failed to fetch subjects'
      console.error('Error fetching subjects:', err)
    } finally {
      loading.value = false
    }
  }

  async function createSubject(subjectData) {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.post('/subjects', subjectData)
      subjects.value.push(response.data)
      return response.data;
    } catch (err) {
      error.value = err.message || 'Failed to create subject'
      console.error('Error creating subject:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateSubject(id, subjectData) {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.put(`/subjects/${id}`, subjectData)
      const index = subjects.value.findIndex(subject => subject.id === id)
      if (index !== -1) {
        subjects.value[index] = response.data
      }
      return response.data;
    } catch (err) {
      error.value = err.message || 'Failed to update subject'
      console.error('Error updating subject:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteSubject(id) {
    loading.value = true
    error.value = null

    try {
      await apiClient.delete(`/subjects/${id}`)
      subjects.value = subjects.value.filter(subject => subject.id !== id)
    } catch (err) {
      error.value = err.message || 'Failed to delete subject'
      console.error('Error deleting subject:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // 상태
    subjects,
    loading,
    error,
    
    // 계산된 속성
    koreanSubjects,
    foreignSubjects,
    specialSubjects,
    
    // 필터링 메서드
    getSubjectsByGrade,
    getSubjectsByLevel,
    getSubjectsByUserType,
    
    // 액션
    fetchSubjects,
    createSubject,
    updateSubject,
    deleteSubject
  }
})
