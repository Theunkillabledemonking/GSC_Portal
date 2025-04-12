import { defineStore } from "pinia";
import { fetchNotices, fetchNoticeById, createNotice, updateNotice, deleteNotice } from "@/services/noticeService";

export const useNoticeStore = defineStore("notices", {
    state: () => ({
        notices: [],
        selectedNotice: null,
        filters: {
            grade: null,
            level: null,
            subject_id: null,
        }
    }),

    actions: {
        // ✅ 공지사항 목록 불러오기 (필터 적용)
        async loadNotices() {
            try {
                this.notices = await fetchNotices(this.filters);
            } catch (error) {
                console.error("공지사항 로드 실패:", error);
            }
        },

        // ✅ 공지사항 상세 조회 (조회수 증가)
        async loadNotice(id) {
            try {
                const data = await fetchNoticeById(id);
                this.selectedNotice = data; // ✅ selectedNotice에 저장
                return data;
            } catch (error) {
                console.error("공지사항 상세 조회 실패:", error);
                return null;
            }
        },

        // ✅ 공지사항 작성
        async addNotice(noticeData, files) {
            try {
                const res = await createNotice(noticeData, files); // ✅ 응답 받아오기
                await this.loadNotices();
                return { success: true, message: res.message || "공지 등록 성공" };
            } catch (error) {
                console.error("공지사항 작성 실패:", error);
                return {
                    success: false,
                    message: error.response?.data?.message || "공지 등록 중 오류 발생",
                };
            }
        },

        // ✅ 공지사항 수정
        async editNotice(id, noticeData, files) {
            try {
                const res = await updateNotice(id, noticeData, files);
                await this.loadNotices();
                return { success: true, message: res.message || '공지 등록 성공' };
            } catch (error) {
                console.error("공지사항 수정 실패:", error);
                return {
                    success: false,
                    message: error.response?.data?.message || "공지 수정 중 오류 발생",
                };
            }
        },

        // ✅ 공지사항 삭제
        async removeNotice(id) {
            try {
                await deleteNotice(id);
                this.notices = this.notices.filter(notice => notice.id !== id);
            } catch (error) {
                console.error("공지사항 삭제 실패:", error);
            }
        },

        // ✅ 필터 변경
        setFilters(filters) {
            this.filters = { ...this.filters, ...filters };
            this.loadNotices();
        }
    }
});
