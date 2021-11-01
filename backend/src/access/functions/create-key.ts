//All dependency imports
import AWS from 'aws-sdk';
import countapi from 'countapi-js';
import {v4 as uuid} from 'uuid';
import moment from 'moment';

//Local dynamodb configuration
const dynamodb = new AWS.DynamoDB(require('../../../../local.dynamodb.json'));

//Catching the data or the error
const until = (promise) => promise.then((data) => [data, null]).catch((err) => [null, err]);

//Function to create countApi key
const createKey = async ({ body }) => {
    //Destructuring body data
    const { namespace } = body && JSON.parse(body);
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

    //Validating if key already exists
    if (findExistsKey.Items.length > 0) {
        throw new Error('400, KeyAlreadyExists');
    }
    //Validating GetItem error
    if (findExistsKeyError) {
        throw new Error('502, KeyGetItemException');
    }

    //Creating the options object
    const options = {
        namespace: namespace,
        key: uuid(),
        value: 0,
        update_lowerbound: 0
    }
    //Creating the countApi key const
    const countApiCreateKey = await countapi.create(options).then((result) => {
        return result;
    });
    //Destructuring countApi key const
    const { key, value } = countApiCreateKey
    //Creating the key object
    const keyObject = {
        id: uuid(),
        namespace,
        key,
        value,
        createdAt: moment().toISOString(),
        updatedAt: moment().toISOString()
    }

    //Converting key object to dynamodb format
    const convertCountApiCreateKeyToDynamoFormat = AWS.DynamoDB.Converter.input(keyObject);
    //Putting key information into the database
    const [Key, KeyError] = await until(dynamodb.putItem({
        TableName: 'Keys',
        Item: convertCountApiCreateKeyToDynamoFormat.M,
        ConditionExpression: 'attribute_not_exists(id)',
    }).promise());

    //Validating insertion error
    if (KeyError) {
        throw new Error('400, KeyPutItemException');
    }
    //Searching for the key created in the database
    const [findKey, findKeyError] = await until(dynamodb.getItem({
        TableName: 'Keys',
        Key: { id: { S: `${ keyObject.id }` } }
    }).promise());

    //Validating search error
    if (findKeyError) {
        throw new Error('502, KeyGetItemException');
    }

    //Returning key data
    return findKey;
}

//Handler function
module.exports.handler = (event, _, callback) => createKey(event)
    .then((response) => callback(null, {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Methods": "POST"
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