let token;
const groupsList   = document.getElementById('groups');
const channelsList = document.getElementById('channels');

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
            <a href="#" class="nav-link d-flex align-items-center">
              <i class="bi bi-people me-2"></i>
              <span>${group.name}</span>
            </a>`;
          groupsList.appendChild(li);
        });

        /* === KANAŁY === */
        channelsList.innerHTML = '';
        json.channels?.forEach(channel => {
          const li = document.createElement('li');
          li.className = 'nav-item';
          li.innerHTML = `
            <a href="#" class="nav-link d-flex align-items-center">
              <i class="bi bi-hash me-2"></i>
              <span>${channel.name}</span>
            </a>`;
          channelsList.appendChild(li);
        });
        break;

      default:
        // inne komunikaty
        break;
    }
  };
}

fetchData();
