let username = document.getElementById('username');
let email = document.getElementById('email');
let password = document.getElementById('password');
let confirmPassword = document.getElementById('confirmPassword');
let submitButton = document.getElementById('submit');
let loginResult = document.getElementById('loginResult');
let spinner = document.getElementById('spinner');   

submitButton.addEventListener('click', async function(event) {
    event.preventDefault();

    if (password.value !== confirmPassword.value) {
        loginResult.innerText = 'Hasła nie są zgodne!';
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        loginResult.innerText = 'Invalid email format!';
        return;
    }

    if (username.value === '' || email.value === '' || password.value === '') {
        loginResult.innerText = 'All fields are required!';
        return;
    }


    let userData = {
        username: username.value,
        email: email.value,
        password: password.value
    };

    spinner.style.display = 'flex';

    let response  = await fetch(`http://192.168.109.120:3000/register?username=${username.value}&email=${email.value}&password=${password.value}`)
    let data = await response.json();
    console.log(data);

    if (data.success == true) {
        window.location.href = 'login.html';
    } else {
        spinner.style.display = 'none';
        loginResult.innerText = 'Rejestracja nie powiodła się: ' + data.message;
    }
});