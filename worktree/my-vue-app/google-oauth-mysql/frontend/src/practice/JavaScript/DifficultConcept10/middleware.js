// let globalLet = 'Hello World!';
// function globalFunction() {
//     return 'Hello Global Function!';
// }
//
// // 전역 실행 컨텍스트 생성
// globalExecutionContext = {
//     VariableEnvironment: {
//         globalLet: 'Hello World!', // 전역 변수
//         globalFunction: <function reference>, // 전역 함수 outer
//     },
//             this: windowm // 브라우저 환경에서는 this는 window 객체를 참조
// }
//
// let globalLet = 'Hello World';
// function outer() {
//     let localLet = '지역변수';
//     console.log(globalLet);
//     console.log(localLet);
// }
// outer();
//
//
//             // outer 실행 컨텍스트
// 'outer 컨텍스트' : {
//     'VariableEnvironment': { // 현재 함수에서 선언된 변수 현재는 없음
//         localVar: "지역변수" // 전역 LexicalEnvironment를 참조 (스코프 체인)
//     },
//     'scopeChain': ['outer 변수객체', '전역 변수객체'],
// }
//
// // 전역 변수 선언
// let globalVar = '전역변수';
//
//             //outer 함수 선언
// function outer() {
//         // outer 함수 실행 시, 현재의 LexicalEnvironment에서 globalVar을 찾음 (전역 변수 사용)
//     console.log(globalVar);
//
//     // inner 함수 선언
//     function inner() {
//         // inner 함수 실행 시 ,내부 변수 선언
//         var innerVar = '내부 함수 변수';
//         // inner 함수의 LexicalEnvironment에서 innerVar를 찾음
//         console.log(innerVar);
//     }
//     // inner 함수 호출
//     inner();
// }
// // outer 함수 호출
// outer();
