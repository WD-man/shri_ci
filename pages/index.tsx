import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const Index = ({ list = [] }) => {
  const [interval, setIntervalDisp] = useState(null);
  const [buildList, setList] = useState(list);

  useEffect(() => {
    if (interval) {
      clearInterval(interval);
    }
    const currInt = setInterval(async () => {
      const { data } = await axios.get('http://localhost:9001/data');
      setList(data.buildList || []);
    }, 5000);
    setIntervalDisp(currInt);
    return () => {
      clearInterval(interval);
    };
  }, [buildList]);
  const getBuilds = buildArray => {
    return buildArray
      .sort((a, b) => {
        return Number(a.timestampStart) > Number(b.timestampStart);
      })
      .map((build, index) => (
        <li key={build.hash}>
          <Link href={`/build/${build.hash}`}>
            <a href={`/build/${build.hash}`}>{build.hash}</a>
          </Link>
          <div className="status">status: {build.status}</div>
        </li>
      ));
  };
  const onButtonClick = async evt => {
    // evt.preventDefault();
    // await axios.get('/build');
  };
  return (
    <div>
      <ul>{getBuilds(buildList)}</ul>
      <form action="/build" method="post" onSubmit={onButtonClick}>
        <input type="text" name="commit" placeholder="commit hash" />
        <input type="text" name="command" placeholder="run command" />
        <button>Build</button>
      </form>
    </div>
  );
};

Index.getInitialProps = async () => {
  const { data } = await axios.get('http://localhost:9001/data');
  return {
    list: data.buildList,
  };
};

export default Index;
