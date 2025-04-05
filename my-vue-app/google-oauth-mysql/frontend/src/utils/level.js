// utils/level.js
export const normalizeLevel = raw => {
    if (!raw) return '';

    const clean = String(raw).trim().toUpperCase();

    const map = {
        '1': 'N1', 'N1': 'N1',
        '2': 'N2', 'N2': 'N2',
        '3': 'N3', 'N3': 'N3',
        '4': 'TOPIK4', 'TOPIK4': 'TOPIK4',
        '5': 'TOPIK6', 'TOPIK6': 'TOPIK6'
    };

    return map[clean] || clean;
};
