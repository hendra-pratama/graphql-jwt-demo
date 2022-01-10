const { ApolloServer, gql, AuthenticationError } = require('apollo-server');
const jwt = require('jsonwebtoken');

// Don't harcode! this is just a demo
const jwtSecret = '3272357538782F413F442A472D4B6150645367566B5970337336763979244226';

// Type definition
const typeDefs = gql`
type Item {
  id: ID
  itemName: String
  weightGr: Int
}

type Query {
  itemCollection: [Item]
  item(id: ID): Item
}
`;

// Function for verifying JWT
const verifyJwt = (jwtToken, secret) => {
    return new Promise((resolve, reject) => {
        jwt.verify(jwtToken, secret, function(err, decoded) {
            if (err) {
                reject(err);
            } else {
                resolve(decoded);
            }
        });
    });
};

// Context object declaration
const contextObject = async ({ req }) => {
    const values = req.headers.authorization.split(' ');
    let verified = null;

    try {
        verified = await verifyJwt(values[1], jwtSecret);
    }
    catch (err) {
        console.log(err);
        throw new AuthenticationError(`INVALID_TOKEN`);
    }

    return {
        tenantid: verified.orgId,
        permissions: verified.permissions
    };
}

const resolver = {
    Query: {
      itemCollection: async (parent, args, context, info) => {
        if (context.permissions.includes('read:items')) {
            return [
                {
                    id: 'item_001',
                    itemName: 'Towel',
                    weightGr: '200'
                }, {
                  id: 'item_002',
                  itemName: 'Pillow',
                  weightGr: '170'
                }
            ];
        }
        
        return [];
      },
      item: async (parent, args, context, info) => {
        if (context.permissions.includes('read:items')) {
            return {
                id: 'item_002',
                itemName: 'Pillow',
                weightGr: '170'
            };
        }
        return null;
      }
    }
};

const port = 4040;
const serverConfig = { 
    port: port, 
    cors: true, 
    typeDefs, 
    resolvers: resolver,
    context: contextObject
};
const server = new ApolloServer(serverConfig);

server.listen({port}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});