// utils/semester.js

// 🎓 명시적으로 범위를 정의
export function getSemesterRange(year, semester) {
    switch (semester) {
        case 'spring':
            return { start_date: `${year}-03-01`, end_date: `${year}-06-30` };
        case 'summer':
            return { start_date: `${year}-07-01`, end_date: `${year}-08-31` };
        case 'fall':
            return { start_date: `${year}-09-01`, end_date: `${year}-12-31` };
        case 'winter':
            return { start_date: `${year + 1}-01-01`, end_date: `${year + 1}-02-28` };
        case 'full':
            return { start_date: `${year}-03-01`, end_date: `${year + 1}-02-28` };
        default:
            throw new Error("학기는 spring/summer/fall/winter/full 중 하나여야 합니다.");
    }
}

// 📅 오늘 기준 현재 학기 자동 추정
export function getCurrentSemester() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    if (month >= 3 && month <= 6) return { semester: 'spring', year };
    if (month >= 7 && month <= 8) return { semester: 'summer', year };
    if (month >= 9 && month <= 12) return { semester: 'fall', year };
    return { semester: 'winter', year: year - 1 }; // 1~2월 → 전년도 겨울학기
}
