export default app => {
  app.get('/notify_agent', (req, res) => {
    console.log('-------------------------');
    console.log('req');
    console.log('-------------------------');
  });

  app.get('/notify_build_result', (req, res) => {
    console.log('-------------------------');
    console.log('not');
    console.log('-------------------------');
  });
};
