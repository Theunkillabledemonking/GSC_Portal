function fetchData(id) {
    return fetch(`https://jsonplaceholder.typicode.com/todos/${id}`)
        .then(response => {
            return response.json();
        });
}

fetchData(1)
    .then(data => { console.log('Fetched data 1:', data); return fetchData(2);})
    .then(data => { console.log('Fetched data 2:', data); return fetchData(3);})
    .then(data => { console.log('Fetched data 3:', data); return fetchData(4);})
    .then(data => { console.log('Fetched data 4:', data); })
    .catch(err => { console.error('에러', err)});


