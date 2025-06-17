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
  token = document.cookie.split('=')[1];
  if (!token) { console.error('Token not found!'); return; }

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

let createNewGroup = document.getElementById('createNewGroup');
let joinToGroup = document.getElementById('joinToGroup');

createNewGroup.addEventListener('click', function (event) {
  event.preventDefault();
  const groupName = prompt('Podaj nazwę nowej grupy:');
  if (groupName) {
    socket.send(JSON.stringify({ opcode: 'new_group', name: groupName }));
    location.reload();
  }
});

joinToGroup.addEventListener('click', function (event) {
  event.preventDefault();
  const groupId = prompt('Podaj ID grupy, do której chcesz dołączyć:');
  if (groupId) {
    socket.send(JSON.stringify({ opcode: 'join_group', group_id: parseInt(groupId) }));
    location.reload();
  }
});