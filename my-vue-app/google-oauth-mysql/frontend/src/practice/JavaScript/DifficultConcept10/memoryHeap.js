// 기본형
let a = 1;
let b = a;

b = 2;

console.log(a);
console.log(b);
console.log(a === b);

// 참조
let c = {name : "kim"};
let d = c;

d.name = 'lee';

console.log(c.name);
console.log(d.name);
console.log(c === d)

// 얕은 복사
let e = {
    name: 'kim',
    more: {
        gender: 'male',
    }
};
let f = { ...e};

f.more.gender = "female";

console.log(f.more.gender);
console.log(e.more.gender);
console.log(e === f);

// 깊은 복사
let B = {
    name: 'kim',
    more: {
        gender: 'male',
    }
};
let A= JSON.parse(JSON.stringify(B)) // json 문자열로 변환 후 새로운 자바스크립트 객체를 생성 원본 객체의 유지

A.more.gender = "female";

console.log(A.more.gender);
console.log(B.more.gender);
console.log(A === B);

// 깊은 복사 immer
import { produce } from 'immer';

let C = {
    more: {
        gender: 'male',
    }
};
let D = produce(C, draft => {
    draft.more.gender = 'female';
});

console.log(C.more.gender);
console.log(D.more.gender);
console.log(C === D);

