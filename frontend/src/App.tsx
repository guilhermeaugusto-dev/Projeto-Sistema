import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Login } from "./pages/Login/login";
import { Registro } from "./pages/Registro/registro";
import { Dashboard } from "./pages/Dashboard/dashboard";
import { Produtos } from "./pages/Produtos/produtos";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Registro />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/produtos" element={<Produtos />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;