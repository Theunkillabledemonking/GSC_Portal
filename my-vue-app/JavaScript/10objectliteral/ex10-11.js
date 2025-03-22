var circle = {
    radius: 5, // <- 프로퍼티

    // 원이 지름
    getDiameter: function() { // <- 메서드
        return 2 * this.radius; // this는 circle을 가리킨다.
    }
};

console.log(circle.getDiameter());
console.log(circle.getDiameter(9999));    // → 여전히 10