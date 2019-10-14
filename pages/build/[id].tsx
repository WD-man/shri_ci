import React from 'react';
import axios from 'axios';

const Build = ({data}) => {
  return (
    <div>
      <div className="">hash: {data.hash}</div>
      <div className="">start data: {data.dateStart}</div>
      <div className="">end data: {data.dateEnd || 'in process'}</div>
      <div className="">status: {data.status}</div>
      <div className="">stdout: {data.stdout}</div>
      <div className="">stderr: {data.stderr}</div>
      <a href="/">Назад</a>
    </div>
  );
};

Build.getInitialProps = async ({ query }) => {
  const { id } = query;
  const { data } = await axios.get(`http://localhost:9001/data?certainBuild=${id}`);
  return {
    data,
  };
};

export default Build;
