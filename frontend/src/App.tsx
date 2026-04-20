import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import SendMoney from './pages/SendMoney';
import RequestMoney from './pages/RequestMoney';
import EscrowCreate from './pages/EscrowCreate';
import EscrowDetails from './pages/EscrowDetails';
import Withdraw from './pages/Withdraw';
import Layout from './components/Layout';
import Deposit from './pages/Deposit';
import Profile from './pages/Profile';

function App() {
  const { token } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!token ? <Register /> : <Navigate to="/" />} />
        
        <Route element={token ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Home />} />
          <Route path="/send" element={<SendMoney />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/request" element={<RequestMoney />} />
          <Route path="/escrow/create" element={<EscrowCreate />} />
          <Route path="/escrow/:id" element={<EscrowDetails />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;