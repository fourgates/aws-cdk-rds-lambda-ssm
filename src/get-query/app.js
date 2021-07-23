const pg = require('pg')
var AWS = require('aws-sdk'),
    region = "us-east-1",
    secretParams,
    pgClient;

// Create a Secrets Manager client
var client = new AWS.SecretsManager({
    region: region
});

exports.handler = async (event, context, callback) => {
    // cache the secret
    if(!secretParams){
        // get secret string from secret manager
        const secretValue = await client.getSecretValue({ SecretId: process.env.SECRET_NAME }).promise();
        secretParams = JSON.parse(secretValue.SecretString);
    }
    // cache the client
    if(!pgClient){
        // https://node-postgres.com/api/client
        var connectionInfo = {
            user: secretParams.username,
            password: secretParams.password,
            host: secretParams.host,
            database: "postgres",
            port: secretParams.port
        };
        pgClient = new pg.Client(connectionInfo);
        await pgClient.connect();
    }

    const queryResult = await pgClient.query("SELECT 'Eli' as player_name");
    return {
        "isBase64Encoded": false,
        "statusCode": 200,
        "body": JSON.stringify(queryResult.rows ? queryResult.rows : undefined)
    }
}