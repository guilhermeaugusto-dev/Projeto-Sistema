document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('usernameLogin');
  const passwordInput = document.getElementById('passwordLogin');
  const togglePassword = document.getElementById('togglePassword');
  const eyeIcon = document.getElementById('eyeIcon');
  const rememberMe = document.getElementById('rememberMeLogin');


  if (togglePassword && passwordInput && eyeIcon) {
    togglePassword.addEventListener('click', () => {
      if (passwordInput.type === 'text') {
        passwordInput.type = 'password';
        eyeIcon.src = '../../imagens/ícone do olho com corte.png';
        eyeIcon.classList.remove('eye-open');
        eyeIcon.classList.add('eye-closed');
      } else {
        passwordInput.type = 'text';
        eyeIcon.src = '../../imagens/ícone do olho sem corte.png';
        eyeIcon.classList.remove('eye-closed');
        eyeIcon.classList.add('eye-open');
      }
    });
  }

  function showMessage(msg, type = 'error', title = '') {
    const options = { message: msg, position: 'topRight', timeout: 2500 };
    if (title) options.title = title;
    switch (type) {
      case 'success': iziToast.success(options); break;
      case 'warning': iziToast.warning(options); break;
      case 'info': iziToast.info(options); break;
      default: iziToast.error(options);
    }
  }


  const dropdown = document.createElement('div');
  dropdown.id = 'loginDropdown';
  dropdown.style.position = 'absolute';
  dropdown.style.backgroundColor = '#fff';
  dropdown.style.border = '1px solid #ccc';
  dropdown.style.width = usernameInput.offsetWidth + 'px';
  dropdown.style.maxHeight = '150px';
  dropdown.style.overflowY = 'auto';
  dropdown.style.display = 'none';
  dropdown.style.zIndex = '1000';
  usernameInput.parentNode.appendChild(dropdown);

  let savedUsers = JSON.parse(localStorage.getItem('savedUsers') || '[]');

  function renderDropdown() {
    dropdown.innerHTML = '';
    savedUsers.forEach(user => {
      const div = document.createElement('div');
      div.textContent = user.username;
      div.style.padding = '5px 10px';
      div.style.cursor = 'pointer';
      div.addEventListener('click', () => {
        usernameInput.value = user.username;
        passwordInput.value = user.password;
        rememberMe.checked = true;
        dropdown.style.display = 'none';
      });
      dropdown.appendChild(div);
    });
    dropdown.style.display = savedUsers.length > 0 ? 'block' : 'none';
  }

  usernameInput.addEventListener('focus', renderDropdown);
  usernameInput.addEventListener('input', () => dropdown.style.display = 'none');
  document.addEventListener('click', e => { if (e.target !== usernameInput) dropdown.style.display = 'none'; });


  async function handleLoginSubmit(event) {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showMessage('Preencha todos os campos!', 'warning', 'Atenção');
      usernameInput.focus();
      return;
    }

    try {
      const res = await fetch('http://26.117.112.62:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, senha: password })
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(payload?.error || 'Falha no login. Verifique suas credenciais.');
      }

      const usuario = payload?.usuario || payload?.user || null;
      const token = payload?.token || null;

      if (!usuario || !token) throw new Error('Resposta do servidor inesperada.');

  
      if (rememberMe.checked) {
        const exists = savedUsers.find(u => u.username === username);
        if (!exists) {
          savedUsers.push({ username, password });
          localStorage.setItem('savedUsers', JSON.stringify(savedUsers));
        }
      }


      localStorage.setItem('token', token);
      localStorage.setItem('usuarioNome', usuario.nome || usuario.username || '');
      localStorage.setItem('usuarioRole', usuario.role || 'USER');

      showMessage('Login realizado com sucesso!', 'success', 'Sucesso');

   
      window.location.href = '../dashboard/dashboard.html';

    } catch (error) {
      console.error('Erro no login:', error);
      showMessage(error.message || 'Erro inesperado.', 'error', 'Erro');
      usernameInput.focus();
      passwordInput.value = '';
    }
  }

  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
});
