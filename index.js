
const axios= require("axios")
let fs = require('fs')
var writeableStream = fs.createWriteStream('output.json');
require('dotenv').config()

async function hello(){
const accessToken = process.env.AZURE_DEVOPS_TOKEN;
let orgName='DevOps-MBU';
let projName= 'DemoProject';
if (accessToken == null || accessToken === '') {
  throw new Error('Please provide an access token');
} else {
  console.log('token is present!');
}
let url= `https://dev.azure.com/${orgName}/${projName}/_apis/pipelines/78/runs?api-version=7.1-preview.1`;
const request = await axios({
    url,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        // This!
        Authorization: `Basic ${Buffer.from(`PAT:${accessToken}`).toString('base64')}`,
        'X-TFS-FedAuthRedirect': 'Suppress',
    },
});
let responsedata = request.data;
const jsonFormat= JSON.stringify(responsedata);
console.log(jsonFormat);
writeableStream.write(jsonFormat, 'UTF8');
writeableStream.end();
writeableStream.on('finish',function(){
	console.log('write completed');
});
}
hello()
