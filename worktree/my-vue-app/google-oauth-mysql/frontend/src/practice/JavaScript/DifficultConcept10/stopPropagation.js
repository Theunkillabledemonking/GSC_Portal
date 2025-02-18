document.getElementById('modalBackground').addEventListener('click', function() {
    this.style.display = 'none';
});

document.getElementById('modalContent'),addEventListener('click', function(event) {
    event.stopPropagation();
})
