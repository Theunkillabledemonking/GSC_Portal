let isUserLoggedIn = false;
document.getElementById('parentDiv').addEventListener('click', function(event) {
    if (!isUserLoggedIn) {
        alert('로그인을 먼저 해주세요');
        event.stopPropagation();
    }
}, true);

document.getElementById('ChildButton').addEventListener('click', function() {
    alert('Button Clicked');
});