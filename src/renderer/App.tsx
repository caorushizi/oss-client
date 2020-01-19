import React from 'react';
import './App.scss';
import Aside from './components/aside';
import Header from './components/header';
import Main from './components/main';

function App() {

  return (
    <div className='App'>
      <Header/>
      <main className='app-main'>
        <Aside/>
        <Main/>
      </main>
    </div>
  );
}

export default App;
