let username = document.getElementById('username');
let password = document.getElementById('password');
let submitButton = document.getElementById('submit');
let loginResult = document.getElementById('loginResult');
let spinner = document.getElementById('spinner');   

// ===== Cookie helpers =====
function setCookie(name, value, days = 7) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days*24*60*60*1000));
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
}
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  return null;
}
function deleteCookie(name) {
  document.cookie = name + '=; Max-Age=0; path=/';
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
        setCookie('token', data.sessionToken, 7);
        window.location.href = 'main.html';
    } else {
        spinner.style.display = 'none';
        loginResult.innerText = 'Logowanie nie powiodło się: ' + data.message;
    }
});