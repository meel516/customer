// authMiddleware.js
const admin = require('../firebaseAdmin'); // Import Firebase Admin SDK setup
const { Unauthorized } = require('http-errors');
const verifyAuth = async (req, res, next) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
  
    if (!idToken) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
  
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = decodedToken; // Attach user data to request
      next(); // Proceed to the protected route
    } catch (error) {
      res.status(401).send({ error: 'Unauthorized' });
    }
  };
  

module.exports = verifyAuth;
