import React from 'react';
import Link from 'next/link';
import axios from 'axios';

export default () => {
  const onButtonClick = async () => {
    await axios.get('/build');
  }
  return (
    <div>
      <ul>
        <li>
          <Link href="/build/[id]" as={`/build/${1}`}>
            <a>a</a>
          </Link>
        </li>
      </ul>
      <button onClick={onButtonClick}>Build</button>
    </div>
  );
};
