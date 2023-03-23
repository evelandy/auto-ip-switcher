const { exec } = require("child_process");
const https = require('https');
require('dotenv').config({path: __dirname + '/.env'});


const IpChecker = (gcc_cf_ip) => {
  exec("curl api.ipify.org", (error, ans) => {
    let public_ip = ans;
    if (error) {
    	console.error(`error: ${error.message}`);
        return;
    }
    if (gcc_cf_ip == public_ip) {
        Matches(public_ip);
    }
    else {
        Discrepant(gcc_cf_ip, public_ip);
    }
  });
}


const Matches = (public_ip) => {
  console.log(`\nMATCH:\n\n========> ${public_ip} <========\n`);
//  uncomment below after a cron has been setup to keep the script running ( MAYBE )
//  ViewARecord();
}


const Discrepant = (public_ip, gcc_cf_ip) => {
  const recordIdRoot = process.env['REC_ID_ROOT'];
  const recordIdWww = process.env['REC_ID_WWW'];
  const recordNameRoot = "gulfcoastcorgis.com";
  const recordNameWww = "www.gulfcoastcorgis.com";
  ChangeARecord(recordIdRoot, recordNameRoot, public_ip, gcc_cf_ip);
  ChangeARecord(recordIdWww, recordNameWww, public_ip, gcc_cf_ip);
//  uncomment below after a cron has been setup to keep the script running ( MAYBE )
//  ViewARecord();
}


const ViewARecord = () => {
  const api_key = process.env['VIEW_API_TOKEN'];
  const email = "griffin.william@outlook.com";
  const zone_id = process.env['ZONE_ID'];

  const headers = {
      "X-Auth-Email": email,
      "X-Auth-Key": api_key,
      "Content-Type": "application/json"
  }

  const url = `https://api.cloudflare.com/client/v4/zones/${zone_id}/dns_records`;

  https.get(url, { headers }, (response) => {
      let data = '';

      response.on('data', (chunk) => {
          data += chunk;
      });

      response.on('end', () => {
          const dataObj = JSON.parse(data);
          if (dataObj.success) {
              const dns_records = dataObj.result;
//              console.log("DNS Records:");
//              for (let record of dns_records) {
//		    console.log(`${record.content}`);
//                  console.log(`Name: ${record.name}, Type: ${record.type}, Content: ${record.content}, ID: ${record.id}`);
//              }
              const a_name_record = dns_records.find(record => record.type === "A" && record.name === "gulfcoastcorgis.com");
	      let gcc_cloudflare_public_ip = a_name_record.content;
	      IpChecker(gcc_cloudflare_public_ip);
          } else {
              console.error(`Data Object Error: ${dataObj.errors[0].message}`);
          }
      })
  }).on('error', (error) => {
      console.error(`Error Viewing Records ( C.F. API ): ${error.message}`);
  });
}


const ChangeARecord = (recordId, recordName, public_ip, gcc_cf_ip) => {

  const zone_id = process.env['ZONE_ID'];
  const apiKey = process.env['EDIT_API_TOKEN'];

  const recordType = "A";
  const recordContent = public_ip;
  const recordComment = `Change made via API: OLD IP => ${gcc_cf_ip}`;

  const url = `https://api.cloudflare.com/client/v4/zones/${zone_id}/dns_records/${recordId}`;

  const data = JSON.stringify({
      type: recordType,
      name: recordName,
      content: recordContent,
      proxied: true,
      comment: recordComment
  });

  const options = {
      method: "PUT",
      headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
      }
  };

  const request = https.request(url, options, response => {
      let responseData = '';

      response.on('data', chunk => {
          responseData += chunk;
      });

      response.on('end', () => {
          console.info(JSON.parse(responseData));
      });
  });

  request.on('error', error => {
      console.error(`Request Error Editing Records ( C.F. API ): ${error}`);
  });

  request.write(data);
  request.end();

}


//ChangeARecord();
ViewARecord();
//Discrepant();
