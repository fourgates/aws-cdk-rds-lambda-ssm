const pg = require('pg')
var AWS = require('aws-sdk'),
    region = "us-east-1",
    secretName = "dev-credentials";

// Create a Secrets Manager client
var client = new AWS.SecretsManager({
    region: region
});

// Call the async function and return NodeJS callback style
exports.handler = async (event, context, callback) => {
    // TODO - abstract secretName to an env variable
    // process.env.SECRET_NAME

    // get secret string from secret manager
    const out = await client.getSecretValue({ SecretId: secretName }).promise();
    const secretParams = JSON.parse(out.SecretString);

    // https://node-postgres.com/api/client
    var connectionInfo = {
        user: secretParams.username,
        password: secretParams.password,
        host: secretParams.host,
        database: "postgres",
        port: secretParams.port
    }
    const pgClient = await new pg.Client(connectionInfo)
    await pgClient.connect();

    const queryResult = await pgClient.query("SELECT 'Eli' as player_name");
    return {
        "isBase64Encoded": false,
        "statusCode": 200,
        "body": JSON.stringify(queryResult.rows ? queryResult.rows : undefined)
    }
}