async function fetchData() {
    const response = await fetch('http://192.168.109.120:3000/login?username=szylaz&password=password');
    const data = await response.json();
    const groups = document.getElementById('groups');
    groups.innerHTML = `<li class="nav-item">
    <a href="#" class="nav-link active d-flex align-items-center justify-content-center" aria-current="page"><i class="bi bi-house-door"></i>${data.userId}</a></li>`;
}

fetchData()