import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import OutcomesPage from './pages/OutcomesPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>NDNE V2 Platform</h1>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/outcomes">Outcomes</Link>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/outcomes" element={<OutcomesPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;