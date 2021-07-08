exports.handler = async function (event){
    return {
        "isBase64Encoded": true,
        "statusCode": "200",
        body: "Hello World!"
    }
}