module.exports.createInstructor = (req, res) => {
    const { username, password } = req.body;
    if (username && password ) {
      res.status(200).json({ username, password });
    } else {
      res.status(400).json({ error: 'Invalid data' });
    }
  };
