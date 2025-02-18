Promise.all([
    new Promise(resolve => setTimeout(() => resolve('Promise1 완료'), 3000)),
    new Promise(resolve => setTimeout(() => resolve('Promise2 완료'), 2000)),
    new Promise(resolve => setTimeout(() => resolve('Promise3 완료'), 1000)),
]).then(console.log);


Promise.race([
    new Promise(resolve => setTimeout(() => resolve('Promise1 완료'), 3000)),
    new Promise(resolve => setTimeout(() => resolve('Promise2 완료'), 2000)),
    new Promise(resolve => setTimeout(() => resolve('Promise3 완료'), 1000)), // 가장 먼저 실행
]).then(console.log);

Promise.any([
    new Promise(resolve => setTimeout(() => resolve('Promise1 완료'), 3000)),
    new Promise(resolve => setTimeout(() => resolve('Promise2 완료'), 2000)), // 2번째로 빨라서 실행 (실패 민감한 비동기작업)
    new Promise((resolve,reject) => setTimeout(() => reject('Promise3 완료'), 1000)),
]).then(console.log);


