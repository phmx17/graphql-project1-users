const graphql = require('graphql');
const axios = require('axios');

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull
} = graphql;

// example data
// const users = [
//   { id: '23', firstName: 'Bill', age: 20 },
//   { id: '47', firstName: 'Karen', age: 30 }
// ]

// Types
const CompanyType = new GraphQLObjectType({
  name: 'Company',
  fields: () => ({  // this is a js closure; it gets defined but not executed until all definitions have been made in the script; necessary since const UserType gets defined after this block
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    users: {
      type: new GraphQLList(UserType),  // tell GraphQL that a list is expected; extract GraphQLList above
      resolve(parentValue, args) {
        return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`) // don't forget this '/users'
          .then(resp => resp.data);
      }
    }
  })
});

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({ 
    id: { type: GraphQLString }  ,
    firstName: { type: GraphQLString }  ,
    age: { type: GraphQLInt },
    company: { 
      type:  CompanyType,
      resolve(parentValue, args) {
      return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
        .then(res => res.data);
      }
    }
  })
}); 

// RootQuery type
const RootQuery = new graphql.GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLString }}, // entry arguments
      resolve(parentValue, args) {  // actual db query; parentValue hardly gets used, args would be the id; 
        return axios.get(`http://localhost:3000/users/${args.id}`)    // GraphQL handles all the types behind the scenes
        .then(resp => resp.data)  // axios returns a .data property; 
      }
    },
  company: {
    type: CompanyType,
    args: { id: { type: GraphQLString }},
    resolve(parentValue, args) {
      return axios.get(`http://localhost:3000/companies/${args.id}`)
        .then(resp => resp.data);
    }
  }
  }
});

const mutation = new GraphQLObjectType({
  name:'Mutation',
  fields: {
    addUser: {    // naming convention by describing the mutation action;
      type: UserType, // expected return type by the mutation; JSON server dnoes not return anything on delete
      args: {
        firstName: { type: new GraphQLNonNull(GraphQLString) }, // must not be null
        age: { type: new GraphQLNonNull(GraphQLInt) },
        companyId: { type: GraphQLString }
      },
      resolve(parentValue, { firstName, age, companyId }){   // destructure from incoming 'args'
        return axios.post('http://localhost:3000/users', { firstName, age, companyId })
          .then(resp => resp.data)
      }
    },
    deleteUser: {
      type: UserType,   // JSON server dnoes not return anything on delete; but other DBs do.
      args: {
        id: { type: new GraphQLNonNull(GraphQLString)}
      },
      resolve(parentValue, { id }){
        axios.delete(`http://localhost:3000/users/${id}`)
         .then(resp => resp.data)
      }
    },
    modifyUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString)},
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        companyId: { type: GraphQLString }        
      },
      resolve(parentValue, { id, firstName, age, companyId }){
        axios.patch(`http://localhost:3000/users/${id}`, { firstName, age, companyId })
          .then(resp => resp.data)

      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation
});