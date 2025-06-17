let token;
const groupsList   = document.getElementById('groups');
const channelsList = document.getElementById('channels');

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

async function fetchData() {
  token = document.cookie.split('=')[1];
  if (!token) { console.error('Token not found!'); return; }

  const socket = new WebSocket('ws://192.168.109.120:3000');

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

        break;

      case 'get_messages_ack':
        console.log('Received messages:', json);
        /* === WIADOMOŚCI === */
        const messagesContainer = document.getElementById('messages');
        messagesContainer.innerHTML = '';

        json.messages?.forEach(message => {
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
          messagesContainer.insertBefore(div, messagesContainer.firstChild);
        });
        if (json.messages.length === 0) {
          const h4 = document.createElement('h4');
          h4.className = 'text-muted';
          h4.innerHTML = 'Brak wiadomości w tym kanale.';
          messagesContainer.appendChild(h4);
        }
        break;
      default:
        // inne komunikaty
        break;
    }
  };
}

fetchData();
// console.log(GetURLParameter('group'));