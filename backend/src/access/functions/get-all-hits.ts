//All dependency imports
import countapi from 'countapi-js';
import AWS from 'aws-sdk';

//Local dynamodb configuration
const dynamodb = new AWS.DynamoDB(require('../../../../local.dynamodb.json'));
//Catching the data or the error
const until = (promise) => promise.then((data) => [data, null]).catch((err) => [null, err]);

//Function to get all hits
const getAllHits = async ({ queryStringParameters }) => {
    //Destructuring queryStringParameters data
    const { namespace } = queryStringParameters;
    //Searching for the key in the database
    const [findExistsKey, findExistsKeyError] = await until(dynamodb.query({
        TableName: 'Keys',
        IndexName: 'namespace-index',
        KeyConditionExpression: '#namespace = :namespace',
        ExpressionAttributeNames: {
            '#namespace': 'namespace'
        },
        ExpressionAttributeValues: {
            ':namespace': { S: namespace },
        },
    }).promise());

    //Validating GetItem error
    if (findExistsKeyError) {
        throw new Error('502, KeyGetItemException');
    }

    //Creating the key const
    const key = findExistsKey.Items[0].key.S;
    //Creating the allHits const based on countApi search result
    const allHits = await countapi.get(namespace, key).then((result) => {
        return result;
    });

    //Returning allHits data
    return allHits;
}

//Handler function
module.exports.handler = (event, _, callback) => getAllHits(event)
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