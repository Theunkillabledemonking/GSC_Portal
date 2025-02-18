document.getElementById('addListItem').addEventListener('click', function() {
    const list = document.getElementById('list');
    const newItem = document.createElement('li');
    newItem.textContent = 'List Item' + (list.children.length + 1);
    list.appendChild(newItem);
})

document.getElementById('list').addEventListener('click', function(event) {
    if (event.target.tagName === 'LI') {
        alert('Clicked on' + event.target.textContent);
    }
})