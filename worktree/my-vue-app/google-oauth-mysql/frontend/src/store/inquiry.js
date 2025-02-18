import { defineStore } from "pinia";

export const useInquiryStore = defineStore("inquiry", {
    state: () => ({
        inquiries: JSON.parse(localStorage.getItem("inquiries")) || [] // ✅ 항상 배열을 보장
    }),
    actions: {
        addInquiry(content) {
            if (!Array.isArray(this.inquiries)) {
                this.inquiries = []; // ✅ inquiries가 배열이 아닐 경우 빈 배열로 초기화
            }

            const newInquiry = {
                id: Date.now(), // ✅ 고유 ID
                content
            };
            this.inquiries.push(newInquiry);
            localStorage.setItem("inquiries", JSON.stringify(this.inquiries)); // ✅ 전체 배열을 저장
        },
        removeInquiry(id) {
            this.inquiries = this.inquiries.filter(inquiry => inquiry.id !== id);
            localStorage.setItem("inquiries", JSON.stringify(this.inquiries)); // ✅ 삭제 후 업데이트
        }
    }
});
