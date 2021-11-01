//All dependency imports
import AWS from 'aws-sdk';

//Local dynamodb configuration
const dynamodb = new AWS.DynamoDB(require('../../../../local.dynamodb.json'));

//Catching the data or the error
const until = (promise) => promise.then((data) => [data, null]).catch((err) => [null, err]);

//Function to list a user
const listUser = async ({ queryStringParameters }) => {
    //Searching for the request id
    const { id } = queryStringParameters;
    //Bringing user from the table
    const [user, userError] = await until(dynamodb.getItem({
        TableName: 'Users',
        Key: { id: { S: `${ id }` } }
    }).promise());

    //Validating insertion error
    if (userError) {
        throw new Error('502, UserGetItemException');
    }

    //Returning user data
    return user;
}

//Handler function
module.exports.handler = (event, _, callback) => listUser(event)
    .then((response) => callback(null, {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Methods": "GET"
        },
        body: JSON.stringify(response)
    }))
    .catch((err) => {
        const [statusCode, message] = err.message.split(', ', 2);
        return callback({
            statusCode: Number(statusCode),
            body: JSON.stringify(message),
        });
    });