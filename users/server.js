const express = require('express');
const expressGraphQL = require('express-graphql');
const schema = require('./schema/schema')

app = express();

app.use('/graphql', expressGraphQL({
  schema, // ES6
  graphiql: true
}));

app.get('/', (req, res, next) => {
  res.send('working or not?')
});


app.listen(4000, () => {
  console.log('Listening on 4000');
});

