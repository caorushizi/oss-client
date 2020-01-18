import React from 'react';
import './App.scss';
import Aside from './components/aside';

function App() {
    return (
      <div className='App'>
        <header className='header'>header</header>
        <main className='main'>
          <Aside/>
          <section>main</section>
        </main>
      </div>
    );
}

export default App;
