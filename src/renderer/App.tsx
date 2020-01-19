import React from 'react';
import './App.scss';
import Aside from './components/aside';
import Header from './components/header';

function App() {

  return (
    <div className='App'>
      <header className='app-header'>
        <Header/>
      </header>
      <main className='app-main'>
        <aside className='app-aside'>
          <Aside/>
        </aside>
        <section>main</section>
      </main>
    </div>
  );
}

export default App;
