// Pinia 스토어 (공지사항 상태 관리)
import { defineStore } from "pinia";
import { fetchNotices, fetchNoticeById, createNotice, updateNotice, deleteNotice} from "@/services/noticeService.js";

export const useNoticeStore = defineStore('notice', {
    state: () => ({
        notices: [], // 공지사항 목록
        selectedNotice: null, // 선택된 공지사항 상세 정보
    }),

    actions: {
        // 공지사항 목록 불러오기
        async loadNotices() {
            const notices = await fetchNotices();
            this.notices = notices.sort((a, b) => b.is_important - a.is_important); // 중요 공지를 맨 위로 정렬
        },

        // 공지사항 상세 불러오기
        async loadNotice(id) {
            this.selectedNotice = await fetchNoticeById(id);
        },

        // 공지사항 등록
        async addNotice(noticeData) {
            await createNotice(noticeData);
            await this.loadNotices(); // 목록 새로고침
        },

        // 공지사항 수정
        async editNotice(id, noticeData) {
            await updateNotice(id, noticeData);
            await this.loadNotices(); // 목록 새로고침
        },

        // 공지사항 삭제
        async removeNotice(id) {
            await deleteNotice(id);
            await this.loadNotices(); // 목록 새로고침
        }
    }
});