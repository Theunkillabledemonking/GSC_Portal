var string = 'Hello World';
var search = 'l';
var index;

// 문자열은 유사 배열이므로 for 문으로 순회할 수 없다.
for (var i = 0; i < string.length; i++) {
    // 문자열의 개별 문자가 'l'이면
    if (string[i] === search) {
        index = i;
        break; // 반복문 종료
    }
}

console.log(index); // 2