let axios = require("axios");
let fs = require("fs");
const { Parser, transforms: { unwind } } = require('json2csv');
let writeableProjStream = fs.createWriteStream("projects.json");
let writeableUserStream = fs.createWriteStream("users.json");

const CSVToJSON = require('csvtojson');

require("dotenv").config();
var express = require('express');
var app = express();

let projnames=[]; 
const fields = ['user', 'project', 'result'];
const json2csvParser = new Parser();
const json2csvfinalParser = new Parser({ fields })


async function azcheckactiveuserallprojects(){
  const accessToken = process.env.AZURE_DEVOPS_TOKEN;
  let organization= "DevOps-MBU";
  
  
  //Project
  let url = `https://dev.azure.com/${organization}/_apis/projects?api-version=6.0`;
  
  if (accessToken == null || accessToken === "") {
    throw new Error("Please provide an access token");
  } else {
    console.log("Token is present!");
  }
  
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
  let valuesArr = responsedata.value;
  
  valuesArr.forEach(obj => {
    projnames.push({name: obj.name, id: obj.id});
    
  });

  writeableProjStream.write(JSON.stringify(projnames, null, 2), "UTF8");
  writeableProjStream.end();
    writeableProjStream.on("finish", function () {
    console.log("write completed");
  });
  
  let csvusername =[];
  let csvprojname= [];
  let username="";
  CSVToJSON().fromFile('user_data.csv')
    .then(users => {
        csvusername = users;
        CSVToJSON().fromFile('proj_data.csv').then(projs =>{
          csvprojname = projs;
        
        let main=[];
        let flag = false;
          for(let k=0; k<csvusername.length; k++){
              username=csvusername[k].name;
              let userfoundtrue=0;
              for(let l=0;l<csvprojname.length; l++){
                organization="DevOps-MBU";
                let project=csvprojname[l].name;
                let url = `https://dev.azure.com/${organization}/${project}/_apis/test/runs?includeRunDetails=true&api-version=6.0`;
                flag = ((k) == (csvusername.length-1)) ? true : false;
                let res= checkProjectTRunsForUser(url, project, username, flag);
                res.then(res => {
                  if(res == null){
                  console.log("This is Null"+res);
                  }else{
                    res.forEach(obj=>{
                      if(obj.result == true && userfoundtrue==0){
                        main.push({user: obj.user, project: obj.project, result: obj.result});
                        userfoundtrue=1;
                        
                      }else if(obj.result == false){
                          main.push({user: obj.user, project: obj.project, result: obj.result});
                        
                      }
                    })
                    console.log("main");
                    if(flag){
                      createFinalCSV(main.flat(1), main.length);
                    }
                    console.log("mainend");

                  }
                });
              }
          }
        }); 
    }).catch(err => {
        console.log(err);
    });
}
azcheckactiveuserallprojects();

async function checkProjectTRunsForUser(url, project, username, flag){
  const accessToken = process.env.AZURE_DEVOPS_TOKEN;
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
  let valuesArr = responsedata.value;
  let mainopr = [];
  let activeusercounter=0;
  //if user not found then 
  let nonactivecntr=0;
  valuesArr.forEach(obj =>{ 
    if(obj.owner.displayName == username){
      console.log("Name: "+obj.owner.displayName+" | Project: "+project+" | TRUE/FALSE: "+" TRUE ");
      mainopr.push({user: username, project: project, result: true});
      activeusercounter=1;
     }
  });
  if(activeusercounter!=1){
    mainopr.push({user: username, project: project, result: false})
  }
  if(mainopr.length == 0){
    return null;
  }else{
    return mainopr;
  }
}

function createFinalCSV(arrofobj, len){
  const csv = json2csvfinalParser.parse(arrofobj);
  fs.writeFile('final_data.csv', csv, function(err) {
    if (err) throw err;
    console.log('file saved');
  });
}
