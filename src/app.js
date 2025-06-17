const messagesContainer = document.getElementById('messageList');
let token;
const groupsList   = document.getElementById('groups');
const channelsList = document.getElementById('channels');
const lessonsList = document.getElementById('lessons');
const socket = new WebSocket('ws://192.168.109.120:3000');

function GetURLParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
}

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

function updateLessons(groupId, json) {
  lessonsList.innerHTML = ''; // Wyczyść listę lekcji

  // Pobierz lekcje dla wybranej grupy
  const groupLessons = json.lessons?.filter(lesson => lesson.group_id == groupId);

  if (groupLessons && groupLessons.length > 0) {
    groupLessons.forEach(lesson => {
      const li = document.createElement('li');
      li.className = 'nav-item';
      li.innerHTML = `
        <a href="?group=${groupId}&lesson=${lesson.id}" class="nav-link d-flex align-items-center">
          <i class="bi bi-journal me-2"></i>
          <span>${lesson.title}</span>
        </a>`;
      lessonsList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.className = 'nav-item text-muted';
    li.innerHTML = 'Brak lekcji dla tej grupy.';
    lessonsList.appendChild(li);
  }
}

async function fetchData() {
  token = getCookie('token');
  if (!token) { console.error('Token not found!'); window.location.href="login.html"; return; }

  socket.onopen = () => {
    console.log('WebSocket connection established.');
    socket.send(JSON.stringify({ opcode: 'auth', token }));
  };

  socket.onmessage = (event) => {
    const json = JSON.parse(event.data);

    switch (json.opcode) {
      case 'auth_ack':
        socket.send(JSON.stringify({ opcode: 'info' }));
        break;

      case 'info_ack':
        /* === dane użytkownika === */
        document.getElementById('username').innerText = json.username ?? '';

        /* === GRUPY === */
        groupsList.innerHTML = '';
        json.groups?.forEach(group => {
          const li = document.createElement('li');
          li.className = 'nav-item';
          li.innerHTML = `
            <a href="main.html?group=${group.id}" class="nav-link d-flex align-items-center">
              <i class="bi bi-people me-2"></i>
              <span>${group.name}</span>
            </a>`;
          groupsList.appendChild(li);
        });

        /* === KANAŁY === */
        let currentGroupId = GetURLParameter('group');
        channelsList.innerHTML = '';
        json.channels?.forEach(channel => {
            
            if (channel.group_id == currentGroupId) {

        const li = document.createElement('li');
          li.className = 'nav-item';
          li.innerHTML = `
            <a href="main.html?group=${currentGroupId}&channel=${channel.id}" class="nav-link d-flex align-items-center">
              <i class="bi bi-hash me-2"></i>
              <span>${channel.name}</span>
            </a>`;
          channelsList.appendChild(li);
            }
        });

        // Wywołaj funkcję aktualizującą lekcje
        updateLessons(currentGroupId, json);

        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('channel')) {
            const channelId = parseInt(urlParams.get('channel'));
            socket.send(JSON.stringify({ opcode: 'get_messages', channel_id: channelId }));
        } else {
            const h4 = document.createElement('h4');
            h4.className = 'text-muted';
            h4.innerHTML = 'Wybierz grupę i kanał…';
        
            const messagesContainer = document.getElementById('messages');
            messagesContainer.innerHTML = '';
            messagesContainer.appendChild(h4);
        }

        if(urlParams.has('lesson')) {
            const lessonId = parseInt(urlParams.get('lesson'));
            const lesson = json.lessons?.find(lesson => lesson.id == lessonId);
            if (lesson) {
              document.getElementById('messages').innerText = lesson.content || 'Brak treści dla tej lekcji.';
            } else {
              document.getElementById('messages').innerText = 'Brak lekcji o podanym ID.';
            }
        }
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        break;

case 'get_messages_ack':
    console.log('Received messages:', json);
    /* === WIADOMOŚCI === */

    // Odwróć kolejność wiadomości
    const reversedMessages = json.messages?.slice().reverse();

    reversedMessages?.forEach(message => {
        const div = document.createElement('div');
        div.className = 'message';
        div.innerHTML = `
            <div class="message-header">
                <strong>${message.username}</strong>
                <span class="text-muted">${new Date(message.created_at).toLocaleTimeString()}</span>
            </div>
            <div class="message-body">
                ${message.content}
            </div>`;
        messagesContainer.appendChild(div); // Dodaj wiadomość na końcu
    });

    if (json.messages.length === 0) {
        const h4 = document.createElement('h4');
        h4.className = 'text-muted';
        h4.innerHTML = 'Brak wiadomości w tym kanale.';
        messagesContainer.appendChild(h4);
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    break;

    case 'new_message':
        console.log('Received new message:', json);

        // Sprawdź, czy dane wiadomości istnieją
        if (!json.content || !json.username || !json.created_at) {
            console.error('Incomplete message data:', json);
            return;
        }

        console.log(json);
        console.log(parseInt(json.channelId), parseInt(GetURLParameter('channel')));
        if (parseInt(json.channelId) != parseInt(GetURLParameter('channel'))) {
            console.log('Message not for this channel. Ignoring.');
            break;
        }

        /* === WIADOMOŚCI === */
        const div = document.createElement('div');
        div.className = 'message';
        div.innerHTML = `
            <div class="message-header">
                <strong>${json.username ?? 'Unknown User'}</strong>
                <span class="text-muted">${new Date(json.created_at).toLocaleTimeString()}</span>
            </div>
            <div class="message-body">
                ${json.content}
            </div>`;
        messagesContainer.appendChild(div); // Dodaj wiadomość na końcu
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        break;

        case 'join_group_ack':
          console.log('Joined group:', json);
        break;
      case 'new_lesson_ack':
        console.log('Lesson added successfully:', json);
        location.reload();
        break;
      case 'error':
        console.error('Server error:', json);
        customAlert('Błąd', json.message || 'Wystąpił błąd podczas dodawania lekcji.');
        break;
      default:
        // inne komunikaty
        break;
    }
  };
}

fetchData();

// ========== Wysyłanie wiadomości ========== //

let messageInput = document.getElementById('messageInput');
let sendMessageButton = document.getElementById('sendMessage');

sendMessageButton.addEventListener('click', function (event) {
  event.preventDefault();

  const messageContent = messageInput.value.trim();
  if (!messageContent) {
    console.log('Message is empty. Not sending.');
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const channelId = urlParams.get('channel');

  if (!channelId) {
    console.log('No channel selected. Cannot send message.');
    return;
  }

  // Wyślij wiadomość do serwera przez WebSocket
  const message = {
    opcode: 'message',
    channel_id: parseInt(channelId),
    content: messageContent,
  };

  socket.send(JSON.stringify(message));
  console.log('Message sent:', message);

  // Wyczyść pole tekstowe po wysłaniu wiadomości
  messageInput.value = '';
});

// ========== Listeners ========== //

let createNewGroup = document.getElementById('createNewGroup');
let joinToGroup = document.getElementById('joinToGroup');
let createNewChanel = document.getElementById('createNewChanel');
let createNewLesson = document.getElementById('createNewLesson');
let signOut = document.getElementById('signOut');

// ===== Custom Modal Prompt/Alert for Electron =====
function customPrompt(title, message, placeholder = '', defaultValue = '') {
  return new Promise((resolve) => {
    const modal = new bootstrap.Modal(document.getElementById('customModal'));
    document.getElementById('customModalLabel').innerText = title;
    document.getElementById('customModalMessage').innerText = message;
    const input = document.getElementById('customModalInput');
    input.style.display = '';
    input.value = defaultValue;
    input.placeholder = placeholder;
    input.focus();
    document.getElementById('customModalOk').onclick = () => {
      modal.hide();
      resolve(input.value);
    };
    // Cancel button closes modal and resolves null
    document.getElementById('customModal').addEventListener('hidden.bs.modal', function handler() {
      document.getElementById('customModal').removeEventListener('hidden.bs.modal', handler);
      resolve(null);
    });
    modal.show();
  });
}

function customAlert(title, message) {
  return new Promise((resolve) => {
    const modal = new bootstrap.Modal(document.getElementById('customModal'));
    document.getElementById('customModalLabel').innerText = title;
    document.getElementById('customModalMessage').innerText = message;
    document.getElementById('customModalInput').style.display = 'none';
    document.getElementById('customModalOk').onclick = () => {
      modal.hide();
      resolve();
    };
    modal.show();
  });
}

createNewGroup.addEventListener('click', async function (event) {
  event.preventDefault();
  const groupName = await customPrompt('Nowa grupa', 'Podaj nazwę nowej grupy:');
  if (groupName) {
    socket.send(JSON.stringify({ opcode: 'new_group', name: groupName }));
    location.reload();
  }
});

joinToGroup.addEventListener('click', async function (event) {
  event.preventDefault();
  const groupId = await customPrompt('Dołącz do grupy', 'Podaj ID grupy, do której chcesz dołączyć:');
  if (groupId) {
    socket.send(JSON.stringify({ opcode: 'join_group', group_id: parseInt(groupId) }));
    location.reload();
  }
});

createNewChanel.addEventListener('click', async function (event) {
  event.preventDefault();
  const channelName = await customPrompt('Nowy kanał', 'Podaj nazwę nowego kanału:');
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('group');

  if (channelName && groupId) {
    socket.send(JSON.stringify({ opcode: 'new_channel', name: channelName, group_id: parseInt(groupId) }));
    location.reload();
  } else if (!groupId) {
    await customAlert('Błąd', 'Nie wybrano grupy.');
  } else {
    await customAlert('Błąd', 'Nie podano nazwy kanału.');
  }
});

createNewLesson.addEventListener('click', async function (event) {
  event.preventDefault();
  const lessonTitle = await prompt('Podaj tytuł nowej lekcji:');
  if (!lessonTitle) return;
  const lessonContent = await prompt('Podaj treść lekcji:');
  if (!lessonContent) return;
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('group');

  if (lessonTitle && lessonContent && groupId) {
    console.log('Sending new_lesson:', { opcode: 'new_lesson', title: lessonTitle, content: lessonContent, group_id: parseInt(groupId) });
    socket.send(JSON.stringify({ opcode: 'new_lesson', title: lessonTitle, content: lessonContent, group_id: parseInt(groupId) }));
    // Wait for ack before reload
  } else if (!groupId) {
    await customAlert('Błąd', 'Nie wybrano grupy.');
  } else {
    await customAlert('Błąd', 'Nie podano tytułu lub treści lekcji.');
  }
});

signOut.addEventListener('click', function (event) {
  event.preventDefault();
  deleteCookie('token');
  window.location.href = 'index.html';
});