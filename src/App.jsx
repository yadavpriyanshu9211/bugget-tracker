import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import Offline from './offline';
// import Greating from './Greating';

function App({name,age}) {
  // const [count, setCount] = useState(0)

  return (
    <>
      {/* <Greating name="Priyanshu " age="20"/> */}
      <Offline/>

    </>
  );
}

export default App
