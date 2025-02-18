document.getElementById('div1').addEventListener('click', function(event) {
    if (event.target.id === 'btn') {
        alert('Button Clicked');
    } else if (event.target.id === 'div2') {
        alert('DIV2 Clicked');
    } else if (event.target.id === 'div1') {
        alert('DIV1 Clicked');
    }
});


