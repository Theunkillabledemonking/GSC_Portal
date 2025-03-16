import { defineStore } from "pinia";
import { fetchNotices, fetchNoticeById, createNotice, updateNotice, deleteNotice } from "@/services/noticeService";

export const useNoticeStore = defineStore("notices", {
    state: () => ({
        notices: [],
        notice: null,
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
                this.notice = await fetchNoticeById(id);
            } catch (error) {
                console.error("공지사항 상세 조회 실패:", error);
            }
        },

        // ✅ 공지사항 작성
        async addNotice(noticeData, files) {
            try {
                await createNotice(noticeData, files);
                await this.loadNotices(); // 목록 새로고침
            } catch (error) {
                console.error("공지사항 작성 실패:", error);
            }
        },

        // ✅ 공지사항 수정
        async editNotice(id, noticeData, files) {
            try {
                await updateNotice(id, noticeData, files);
                await this.loadNotices();
            } catch (error) {
                console.error("공지사항 수정 실패:", error);
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
