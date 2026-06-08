
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET não definido. Defina a variável de ambiente JWT_SECRET.');
}
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Token não fornecido.' });

    const parts = authHeader.split(' ');
    if (parts.length !== 2) return res.status(401).json({ error: 'Formato de token inválido.' });

    const scheme = parts[0];
    const token = parts[1];

 
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; 
    next();
  } catch (err) {
    console.error('Erro em verifyToken:', err);
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

export const isAdmin = (req, res, next) => {
  try {
    const role = (req.user?.role || '').toUpperCase();
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
    }
    next();
  } catch (err) {
    console.error('Erro em isAdmin:', err);
    return res.status(500).json({ error: 'Erro ao verificar permissões.' });
  }
};
