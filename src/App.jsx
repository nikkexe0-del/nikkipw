import React from 'react';
import Navbar from './components/Navbar';
import ScienceAndFun from './components/ScienceAndFun';

const App = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#080c12' }}>
      <Navbar />
      <ScienceAndFun />
    </div>
  );
};

export default App;
