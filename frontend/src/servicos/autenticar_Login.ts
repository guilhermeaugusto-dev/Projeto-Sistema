export async function autenticar_Login(email: string, password: string) {

  const response = await fetch(`http://localhost:3001/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      senha: password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Falha ao autenticar");
  }

  return data;
}