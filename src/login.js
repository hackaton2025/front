let username = document.getElementById('username');
let password = document.getElementById('password');
let submitButton = document.getElementById('submit');
let loginResult = document.getElementById('loginResult');
let spinner = document.getElementById('spinner');   

//if token in local storage
if (localStorage.getItem('token')) {
    window.location.href = 'main.html';
}

submitButton.addEventListener('click', async function(event) {
    event.preventDefault();

    if (username.value === '' || password.value === '') {
        loginResult.innerText = 'All fields are required!';
        return;
    }


    let userData = {
        username: username.value,
        password: password.value
    };

    spinner.style.display = 'flex';

    let response  = await fetch(`http://192.168.109.120:3000/login?username=${username.value}&password=${password.value}`);
    let data = await response.json();
    console.log(data);

    if (data.success == true) {
        console.log(data)
        localStorage.setItem('token', data.sessionToken);
        window.location.href = 'main.html';
    } else {
        spinner.style.display = 'none';
        loginResult.innerText = 'Logowanie nie powiodło się: ' + data.message;
    }
});