// authRoute.js
const express = require('express');
const admin = require('./firebaseAdmin');
const router = express.Router();

router.post('/verifyToken', async (req, res) => {
  const idToken = req.body.idToken;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    res.status(200).send({ uid });
  } catch (error) {
    res.status(401).send({ error: 'Unauthorized' });
  }
});

module.exports = router;
