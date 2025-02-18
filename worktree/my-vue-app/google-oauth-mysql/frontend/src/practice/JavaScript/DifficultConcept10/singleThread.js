const function1 = () => console.log('hi');
const function2 = () => fetch('https://jsonplaceholder.typicode.com/posts/1').then(response => response.json().then(console.log));
const function3 = () => console.log('bye');

function1();
function2();
function3();