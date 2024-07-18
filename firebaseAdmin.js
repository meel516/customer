const admin =require('firebase-admin')
const serviceAccount = require('./tidy-tract-372208-firebase-adminsdk-9zjgo-f744724df6.json')
admin.initializeApp({
  credential:admin.credential.cert(serviceAccount)
})
module.exports =admin