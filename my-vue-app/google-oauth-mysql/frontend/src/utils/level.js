// utils/level.js
export const normalizeLevel = (rawLevel) => {
    const map = {
        '1': 'N1',
        '2': 'N2',
        '3': 'N3',
        '4': 'TOPIK4',
        '5': 'TOPIK6'
    };

    // 이미 문자열로 되어있을 수도 있음
    return map[rawLevel] || rawLevel?.toUpperCase();
};
