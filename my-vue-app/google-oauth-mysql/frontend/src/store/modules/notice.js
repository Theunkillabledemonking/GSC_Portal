import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import { fetchNotices, fetchNoticeById, createNotice, updateNotice, deleteNotice } from "@/services/noticeService";

export const useNoticeStore = defineStore("notices", () => {
    // 상태 정의
    const notices = ref([]);
    const selectedNotice = ref(null);
    const filters = reactive({
            grade: null,
            level: null,
            subject_id: null,
            is_foreigner: null   // 👈 0: 한국인, 1: 외국인
    });

    // 액션
        // ✅ 공지사항 목록 불러오기 (필터 적용)
    async function loadNotices() {
            try {
            notices.value = await fetchNotices(filters);
            } catch (error) {
                console.error("공지사항 로드 실패:", error);
            }
    }

    // ✅ 공지사항 상세 불러오기
    async function loadNoticeById(id) {
            try {
            selectedNotice.value = await fetchNoticeById(id);
            return selectedNotice.value;
            } catch (error) {
            console.error(`공지사항 ID ${id} 로드 실패:`, error);
                return null;
            }
    }

    // ✅ 공지사항 등록
    async function addNotice(noticeData) {
            try {
            const result = await createNotice(noticeData);
            notices.value.push(result);
            return result;
            } catch (error) {
            console.error("공지사항 등록 실패:", error);
            throw error;
            }
    }

        // ✅ 공지사항 수정
    async function editNotice(id, noticeData) {
            try {
            const result = await updateNotice(id, noticeData);
            const index = notices.value.findIndex(n => n.id === id);
            if (index !== -1) {
                notices.value[index] = result;
            }
            if (selectedNotice.value && selectedNotice.value.id === id) {
                selectedNotice.value = result;
            }
            return result;
            } catch (error) {
            console.error(`공지사항 ID ${id} 수정 실패:`, error);
            throw error;
            }
    }

        // ✅ 공지사항 삭제
    async function removeNotice(id) {
            try {
                await deleteNotice(id);
            notices.value = notices.value.filter(n => n.id !== id);
            if (selectedNotice.value && selectedNotice.value.id === id) {
                selectedNotice.value = null;
            }
            } catch (error) {
            console.error(`공지사항 ID ${id} 삭제 실패:`, error);
            throw error;
            }
    }

    // ✅ 필터 업데이트
    function updateFilters(newFilters) {
        Object.assign(filters, newFilters);
    }

    // ✅ 필터 초기화
    function resetFilters() {
        Object.keys(filters).forEach(key => {
            filters[key] = null;
        });
    }

    return {
        // 상태
        notices,
        selectedNotice,
        filters,
        
        // 액션
        loadNotices,
        loadNoticeById,
        addNotice,
        editNotice,
        removeNotice,
        updateFilters,
        resetFilters
    };
});
