import { defineStore } from "pinia";
import * as subjectApi from "@/services/subjectService.js";

export const useSubjectStore = defineStore("subjectStore", {
    state: () => ({
        all: [],            // 전체 과목
        byYear: {},         // year 기준 과목 캐시
        byLevel: {},        // level 기준 캐시
        bySemester: {},     // {year-semester} 기준 캐시
        special: []         // 특강 전용
    }),

    actions: {
        async loadAllSubjects() {
            const { subjects } = await subjectApi.getAllSubjects();
            this.all = subjects;
        },

        async loadSubjectsByYear(year) {
            if (!this.byYear[year]) {
                const { subjects } = await subjectApi.getSubjectsByYear(year);
                this.byYear[year] = subjects;
            }
            return this.byYear[year];
        },

        async loadSubjectsByLevel(level) {
            if (!this.byLevel[level]) {
                const { subjects } = await subjectApi.getSubjectsByLevel(level);
                this.byLevel[level] = subjects;
            }
            return this.byLevel[level];
        },

        async loadSubjectsBySemester({ year, semester }) {
            const key = `${year}-${semester}`;
            if (!this.bySemester[key]) {
                const { subjects } = await subjectApi.getSubjectsBySemester({ year, semester });
                this.bySemester[key] = subjects;
            }
            return this.bySemester[key];
        },

        async loadSpecialSubjects() {
            const { specialLectures } = await subjectApi.getSpecialLectures();
            this.special = specialLectures;
        },

        async addSubject(subject) {
            await subjectApi.createSubject(subject);
            this.clearCache();
            await this.loadAllSubjects();
        },

        async updateSubject(subject) {
            await subjectApi.updateSubject(subject);
            this.clearCache();
            await this.loadAllSubjects();
        },

        async deleteSubject(id) {
            await subjectApi.deleteSubject(id);
            this.clearCache();
            await this.loadAllSubjects();
        },

        clearCache() {
            this.byYear = {};
            this.byLevel = {};
            this.bySemester = {};
            this.special = [];
        }
    }
});
