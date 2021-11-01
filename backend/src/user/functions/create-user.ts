//All dependency imports
import AWS from 'aws-sdk';
import {v4 as uuid} from 'uuid';
import moment from 'moment';

//Local dynamodb configuration
const dynamodb = new AWS.DynamoDB(require('../../../../local.dynamodb.json'));

//Catching the data or the error
const until = (promise) => promise.then((data) => [data, null]).catch((err) => [null, err]);

//Function to create user
const createUser = async ({ body }) => {
    //User information from body
    const userData = body && JSON.parse(body);
    //Destructuring user data
    const { name, email } = userData;
    //Email validation
    const emailRegex = /^[a-z0-9.]+@[a-z0-9]+\.([a-z]+)?$/i;

    if (!emailRegex.test(email)) {
        throw new Error('400, Invalid email address');
    }

    //User object
    const userObject = {
        id: uuid(),
        name: name,
        email: email,
        createdAt: moment().toISOString(),
        updatedAt: moment().toISOString(),
    };
    //Converting user object to dynamodb format
    const convertUserToDynamoFormat = AWS.DynamoDB.Converter.input(userObject);
    //Putting user information into the database
    const [user, userError] = await until(dynamodb.putItem({
        TableName: 'Users',
        Item: convertUserToDynamoFormat.M,
        ConditionExpression: 'attribute_not_exists(id)',
    }).promise());

    //Validating insertion error
    if (userError) {
        throw new Error('502, UserPutItemException');
    }
    //Searching for the user created in the database
    const [findUser, findUserError] = await until(dynamodb.getItem({
        TableName: 'Users',
        Key: { id: { S: `${ userObject.id }` } }
    }).promise());

    //Validating search error
    if (findUserError) {
        throw new Error('502, UserGetItemException');
    }

    //Returning user data
    return findUser;
}

//Handler function
module.exports.handler = (event, _, callback) => createUser(event)
    .then((response) => callback(null, {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Methods": "POST, GET"
        },
        body: JSON.stringify(response)
    }))
    .catch((err) => {
        const [statusCode, message] = err.message.split(', ', 2);
        return callback(null, {
            statusCode: Number(statusCode),
            body: JSON.stringify(message),
        });
    });