import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/store";

import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/Login/LoginView.vue';
import OauthSuccessView from "@/views/Login/OauthSuccessView.vue";
import RegisterView from '@/views/Login/RegisterView.vue';
import AdminView from '@/views/AdminView.vue';

import TestDashboard from "@/views/testDashboard.vue";
import DashboardView from '@/views/DashboardView.vue';
import MainDashboardView from "@/views/MainDashboardView.vue";
import AdminUserView from '@/views/Login/AdminUserList.vue';

import NoticesView from '@/views/Notices/NoticesView.vue';
import NoticeForm from "@/views/Notices/NoticeCreateView.vue";
import NoticeDetailView from "@/views/Notices/NoticeDetailView.vue";
import NoticeEditView from "@/views/Notices/NoticeEditView.vue";
import SubjectList from "@/components/admin/SubjectList.vue";
import TimetableView from "@/views/TimetableView.vue";

import CalendarWithEvents from "@/components/specific/CalendarWithEvents.vue";
import LineConnectModal from "@/components/LineConnectModal.vue";

const routes = [
    { path: "/", redirect: "/login" },
    { path: '/login', name: 'Login', component: LoginView },
    { path: '/register', name: 'Register', component: RegisterView },
    { path: '/oauth/success', name: 'OauthSuccess', component: OauthSuccessView },
    { path: '/admin', name: 'AdminView', component: AdminView, meta: { requiresAuth: true, adminOnly: true} },

    { path: '/test-dashboard', name: TestDashboard, component: TestDashboard, meta: { requiresAuth: true } },
    { path: '/main-dashboard', name: 'MainDashboard', component: MainDashboardView, meta: { requiresAuth: true } },
    { path: '/dashboard', name: 'Dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/admin/users', name: 'AdminUserList', component: AdminUserView, meta: { requiresAuth: true } },
    { path: '/calendar', name: 'Calendar', component: CalendarWithEvents, meta: { requiresAuth: true } },

    { path: '/notices', name: 'Notices', component: NoticesView },
    { path: '/notices/create', name: 'NoticeCreate', component: NoticeForm },
    { path: '/notices/:id', name: 'NoticeDetail', component: NoticeDetailView },
    { path: '/notices/edit/:id', name: 'NoticeEdit', component: NoticeEditView },

    { path: '/admin/subjects', name: 'SubjectManage', component: SubjectList, meta: { requiresAuth: true } },

    { path: '/timetables', name: 'TimetableView', component: TimetableView, meta: { requiresAuth: true } },
    { path: '/line-connect', name: 'LineConnect', component: LineConnectModal },

];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// Navigation guard
router.beforeEach(async (to, from, next) => {
    // 로그인 페이지로 가는 경우는 항상 허용
    if (to.path === '/login' || to.path === '/register' || to.path === '/oauth/success') {
        return next();
    }

    const authStore = useAuthStore();
    const isAuthenticated = authStore.isLoggedIn;

    // 인증이 필요한 페이지인 경우
    if (to.meta.requiresAuth) {
        if (!isAuthenticated) {
            return next('/login');
        }

        // 관리자 전용 페이지 체크
        if (to.meta.adminOnly && !authStore.isAdmin) {
            alert("관리자 권한이 필요합니다.");
            return next('/dashboard');
        }
    }

    next();
});

export default router;
