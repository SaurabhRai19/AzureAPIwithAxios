const axios = require("axios");
let fs = require("fs");
var writeableStream = fs.createWriteStream("output.json");
require("dotenv").config();

async function azureApiCall() {
  const accessToken = process.env.AZURE_DEVOPS_TOKEN;
  let organization = "DevOps-MBU";
  let project = "DemoProject";
  let pipelineId = 78 || null;
  let runId = 971 || null;
  if (accessToken == null || accessToken === "") {
    throw new Error("Please provide an access token");
  } else {
    console.log("token is present!");
  }
  let url = `https://dev.azure.com/${organization}/${project}/_apis/pipelines?api-version=7.1-preview.1&=`;
  const request = await axios({
    url,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      // This!
      Authorization: `Basic ${Buffer.from(`PAT:${accessToken}`).toString(
        "base64"
      )}`,
      "X-TFS-FedAuthRedirect": "Suppress",
    },
  });
  let responsedata = request.data;
  const jsonFormat = JSON.stringify(responsedata, null, 2);
  console.log(jsonFormat);
  writeableStream.write(jsonFormat, "UTF8");
  writeableStream.end();
  writeableStream.on("finish", function () {
    console.log("write completed");
  });
}
azureApiCall();

// Gets a run for a particular pipeline- https://dev.azure.com/${organization}/${project}/_apis/pipelines/${pipelineId}/runs/${runId}?api-version=7.1-preview.1
// Gets top 10000 runs for a particular pipeline- https://dev.azure.com/${orgName}/${projName}/_apis/pipelines/${pipelineId}/runs?api-version=7.1-preview.1
// Get all the pipelines in a project- https://dev.azure.com/${organization}/${project}/_apis/pipelines?api-version=7.1-preview.1&=
// For azure api calls - https://docs.microsoft.com/en-us/rest/api/azure/devops/?view=azure-devops-rest-7.1
