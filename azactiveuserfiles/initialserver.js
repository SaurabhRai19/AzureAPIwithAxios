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
let usernames=[];
let csvprojname = [];

var csvusername=[];
const fields = ['user', 'project', 'result'];
//const transforms = [unwind({ paths: ['projnames','projnames.names'] })];
//const json2csvParser = new Parser({ fields });
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
  // for(let i=1; i<projnames.names.length; i++){
  //   project[i].name.concat(projnames.names[i]);
  //   project[i].id =id+1;
  // }
//  console.log(project);
  writeableProjStream.write(JSON.stringify(projnames, null, 2), "UTF8");
  writeableProjStream.end();
    writeableProjStream.on("finish", function () {
    console.log("write completed");
  });
  //console.log('\n');
  
 // console.log(projnames);
  const csv = json2csvParser.parse(projnames);
  //console.log(csv);
  fs.writeFile('proj_data.csv', csv, function(err) {
    if (err) throw err;
    console.log('file saved');
  });
  // Already used as nested in user CSVToJSON function below
  // CSVToJSON().fromFile('proj_data.csv')
  //   .then(projects => {
  //       // users is a JSON array
  //       // log the JSON array
  //       console.log(projects);
  //   }).catch(err => {
  //       // log error if any
  //       console.log(err);
  //   });

    //User
    
    let i=0;
    while(i<1){
      let url = `https://vssps.dev.azure.com/${organization}/_apis/graph/users?api-version=6.0-preview.1`;
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
    usernames.push({name: obj.displayName, id: obj.originId});
    
  });
  writeableProjStream.write(JSON.stringify(usernames, null, 2), "UTF8");
  writeableProjStream.end();
    writeableProjStream.on("finish", function () {
    console.log("write completed");
  });
  
  const csv = json2csvParser.parse(usernames);
  //Convert JSON object to CSV 
  //console.log(csv);
  fs.writeFile('user_data.csv', csv, function(err) {
    if (err) throw err;
    console.log('file saved');
  });
  let csvusername =[];
  let csvprojname= [];
  let username="";
  CSVToJSON().fromFile('user_data.csv')
    .then(users => {
        // users is a JSON array
        // log the JSON array
        csvusername = users;
        CSVToJSON().fromFile('proj_data.csv').then(projs =>{
          csvprojname = projs;
        // console.log(csvprojname);
        let main=[];
        let flag = false;
          for(let k=0; k<csvusername.length; k++){
              username=csvusername[k].name;
              for(let l=0;l<csvprojname.length; l++){
                organization="DevOps-MBU";
                let project=csvprojname[l].name;
                let url = `https://dev.azure.com/${organization}/${project}/_apis/test/runs?includeRunDetails=true&api-version=6.0`;
                flag = ((k) == (csvusername.length-1)) ? true : false;
                let res= mainoperation(url, project, username, flag);
                res.then(res => {
                  if(res == null){
                  console.log("This is Null"+res);
                  }else{
                    //console.log(res);
                    main.push(res);
                    res.forEach(obj=>{
                      main.push({user: obj.user, project: obj.project, result: obj.result});
                    })
                    console.log("main");
                    if(flag){
                    final(main.flat(1), main.length);
                      
                    }
                    console.log("mainend");

                  }
                });
              }
          }
          
//          console.log(main);
        });
        
        // let username="";
        // for(let j=0; j<csvprojname.length; j++){
        //     username=csvusername[j].name;
        //     console.log(username);
        // }
        // username="";
        // for(let j=0; j<csvusername.length; j++){
        //     username=csvusername[j].name;
        //     console.log(username);
        // }
        
    }).catch(err => {
        console.log(err);
    });
    i++;
    }
    // console.log(csvusername);
    // let username="";
    //     for(let j=0; j<csvusername.length; j++){
    //         username=csvusername[j].name;
    //         console.log(username);
    //     }
}
azcheckactiveuserallprojects();

function final(arrofobj, len){
  // for(let i=0; i<len; i++){
  // console.log(arrofobj[i]);

  // }
  const csv = json2csvfinalParser.parse(arrofobj);
  //Convert JSON object to CSV 
  //console.log(csv);
  fs.writeFile('final_data.csv', csv, function(err) {
    if (err) throw err;
    console.log('file saved');
  });
}

async function mainoperation(url, project, username, flag){
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
  valuesArr.forEach(obj =>{ 
    if(obj.owner.displayName == username){
      console.log("Name: "+obj.owner.displayName+" | Project: "+project+" | TRUE/FALSE: "+" TRUE ");
      mainopr.push({user: username, project: project, result: true});
    }//else{
    //   console.log("Name: "+obj.owner.displayName+" | Project: "+project+" | TRUE/FALSE: "+" FALSE ");
    // }
  });
  if(mainopr.length == 0){
    return null;
  }else{
    return mainopr;
  }
}
