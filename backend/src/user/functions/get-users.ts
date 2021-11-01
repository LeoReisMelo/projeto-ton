//All dependency imports
import AWS from 'aws-sdk';

//Local dynamodb configuration
const dynamodb = new AWS.DynamoDB(require('../../../../local.dynamodb.json'));

//Catching the data or the error
const until = (promise) => promise.then((data) => [data, null]).catch((err) => [null, err]);

//Function to list all users
const listUsers = async () => {
    //Bringing all users from the table
    const [users, usersError] = await until(dynamodb.scan({
        TableName: 'Users'
    }).promise());

     //Validating insertion error
     if (usersError) {
        throw new Error('502, UsersGetItemException');
    }

    //Returning users data
    return users;
}

//Handler function
module.exports.handler = (event, _, callback) => listUsers()
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