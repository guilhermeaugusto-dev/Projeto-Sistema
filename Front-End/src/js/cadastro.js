document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById("passwordLogin");
  const eyeIcon = document.getElementById("eyeIcon");

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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("username").value.trim();
    const username = document.getElementById("usernameLogin").value.trim();
    const senha = document.getElementById("passwordLogin").value.trim();

    if (!nome || !username || !senha) {
      iziToast.error({
        title: "Erro",
        message: "Preencha todos os campos!",
        position: "topRight"
      });
      return;
    }

    try {
      const response = await fetch("http://26.117.112.62:3001/api/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nome, username, senha })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro no cadastro");
      }

      iziToast.success({
        title: "Sucesso",
        message: "Usuário cadastrado com sucesso!",
        position: "topRight"
      });


    } catch (error) {
      iziToast.error({
        title: "Erro",
        message: error.message,
        position: "topRight"
      });
    }
  });
});
