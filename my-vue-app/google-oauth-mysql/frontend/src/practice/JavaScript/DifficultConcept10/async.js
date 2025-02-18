function getData() {
    return fetch("http://jsonplaceholder.typicode.com/pofsts/1")
};

const loadDataPromise = () => {
    getData()
        .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP Error! status: ${res.status}`);
        }
        res.json()
        })
        .then(data => console.log(data))
        .catch(error => {
            console.error('Error fetching data: ', error)
    })
}
// loadDataPromise();

const loadDataAwait = async () => {
    try {
        const result = await getData();
        if (!result.ok) {
            throw new Error(`HTTP Error! status: ${res.status}`);
        }
        const data = await result.json();
        console.log(data);
    } catch (error) {
        console.error('Error fetching data: ', error.message)
    }
}

loadDataAwait();