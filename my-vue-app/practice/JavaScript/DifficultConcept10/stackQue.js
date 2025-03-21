const outer = function() {
    let a = 1;
    const inner = function() {
        return ++a
    };
    return inner;
}

const count = outer();
console.log(count());
console.log(count());

const a = 1;
const outers = () => {
    console.log('a: ', a)
};
outers();
