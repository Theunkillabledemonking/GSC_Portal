var x = 2;
// 2 % 2는 0이고 0은 false로 암묵적 타입 변환됨.
var result = x % 2 ? '홀수' : '짝수';

console.log(result);

x = 10;

// if ... else 문은 표현식이 아닌 문이다. 따라서 값처럼 사용할 수 없다.
result = if (x % 2) { result = '홀수'; } else { result = '짝수'; };
// SyntaxError: Unexpected token 'if'