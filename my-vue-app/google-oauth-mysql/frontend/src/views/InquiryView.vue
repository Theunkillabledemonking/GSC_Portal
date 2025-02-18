<template>
  <div>
    <h1>📩 문의사항</h1>
    <input v-model="newInquiry" placeholder="문의 내용을 입력해주세요" />
    <button @click="addInquiry">문의 등록</button>
    <ul>
      <li v-for="inquiry in inquiryStore.inquiries" :key="inquiry.id">
        {{ inquiry.content }}
        <button @click="removeInquiry(inquiry.id)">삭제</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useInquiryStore } from "../store/inquiry.js";

const inquiryStore = useInquiryStore();
const newInquiry = ref("");

// ✅ 컴포넌트가 로드될 때 기존 데이터 불러오기
onMounted(() => {
  inquiryStore.inquiries = JSON.parse(localStorage.getItem("inquiries")) || [];
});

const addInquiry = () => {
  if (newInquiry.value.trim() !== "") {
    inquiryStore.addInquiry(newInquiry.value);
    newInquiry.value = ""; // 입력값 초기화
  }
};

const removeInquiry = (id) => {
  inquiryStore.removeInquiry(id);
};
</script>
