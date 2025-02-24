import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import LoginSuccess from "../views/LoginSuccess.vue";
import TimetableView from "../views/TimetableView.vue";
import Admin from "../views/Admin.vue";
import Register from "../views/Register.vue";
import PendingApproval from "@/views/PendingApproval.vue";
import { useAuthStore } from "../store/auth.js";
import { nextTick } from "vue";

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/login-success", name: "LoginSuccess", component: LoginSuccess },
  { path: "/register", name: "Register", component: Register },
  { path: "/dashboard", name: "Dashboard", component: Home },
  { path: "/pending-approval", name: "PendingApproval", component: PendingApproval },
  {
    path: "/timetable",
    name: "Timetable",
    component: TimetableView,
    meta: { requiresAuth: true },
  },
  {
    path: "/admin",
    name: "Admin",
    component: Admin,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/:catchAll(.*)",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ✅ 페이지 접근 제한
router.beforeEach(async (to, from, next) => {
  await nextTick(); // Pinia 상태 초기화 대기
  const authStore = useAuthStore();

  // ✅ 로그인하지 않았을 때 보호된 페이지 접근 시 로그인 페이지로 이동
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next("/");
  }

  // ✅ 관리자 권한 필요하지만 관리자 아님
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next("/");
  }

  if (authStore.isAuthenticated) {
    // ✅ 승인 대기 중이면 어디로 가도 "/pending-approval"로 이동
    if (authStore.isFirstInput) {
      return next("/pending-approval");
    }
  }

  next();
});

export default router;
