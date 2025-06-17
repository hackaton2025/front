let token; 
async function fetchData() {
    const response = await fetch('http://192.168.109.120:3000/login?username=szylaz&password=password');
    const data = await response.json();

    token = document.cookie.split('=')[1];
}

fetchData()