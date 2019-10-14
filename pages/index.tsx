import React from 'react';
import Link from 'next/link';
import axios from 'axios';

export default () => {
  const getBuilds = buildArray => {
    return buildArray.map((build, index) => (
      <li key={'buld_' + index} >
        <Link href={'#'}>
          <a href="#">build</a>
        </Link>
      </li>
    ));
  };
  const onButtonClick = async (evt) => {
    // evt.preventDefault();
    // await axios.get('/build');
  };
  return (
    <div>
      <ul>{getBuilds(Array.from({ length: 3 }))}</ul>
      <form action="/build" method="post" onSubmit={onButtonClick}>
        <input type="text" name="hash" placeholder="commit hash" />
        <input type="text" name="command" placeholder="run command" />
        <button>Build</button>
      </form>
    </div>
  );
};
