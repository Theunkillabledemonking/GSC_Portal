import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import LoginView from "../views/LoginView.vue";
import LoginSuccess from "../views/LoginSuccess.vue";
import BoardView from "../views/BoardView.vue";
import InquiryView from "../views/InquiryView.vue";
import TimetableView from "../views/TimetableView.vue";
import { useAuthStore } from "../store/auth.js";

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/login", component: LoginView },
  { path: "/login-success", component: LoginSuccess },
  {
    path: "/board",
    name: "Board",
    component: BoardView,
    meta: { requiresAuth: true },
  },
  {
    path: "/inquiry",
    name: "Inquiry",
    component: InquiryView,
    meta: { requiresAuth: true },
  },
  {
    path: "/timetable",
    name: "Timetable",
    component: TimetableView,
    meta: { requiresAuth: true },
  },
  { path: "/public", redirect: "/" }, // "/my-vue-app/public" 방지
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 로그인 여부에 따라 페이지 접근 제한
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next("/login"); // 로그인 하지 않았을 경우 로그인 페이지로 이동
  } else {
    next(); // 인증된 경우 계속 진행
  }
});

export default router;
