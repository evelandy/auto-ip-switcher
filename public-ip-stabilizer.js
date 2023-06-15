const express = require('express');
const { exec } = require("child_process");
const fetch = require("node-fetch");
require('dotenv').config({ path: __dirname + '/.env' });

let app = express(); // added to create for cloudflare message timestamp

const IpChecker = (gcc_cf_ip) => {
  exec("curl api.ipify.org", (error, ans) => {
    let public_ip = ans.trim(); // Trim the trailing newline character
    if (error) {
      console.error(`IP Check Error: ${error.message}`);
      return;
    }
    if (gcc_cf_ip === public_ip) {
      Matches(public_ip);
    } else {
      Discrepant(public_ip, gcc_cf_ip);
    }
  });
};

const Matches = (public_ip) => {
  console.log(`\nMATCH:\n\n========> ${public_ip} <========\n`);
  // Uncomment below after a cron has been set up to keep the script running (MAYBE)
  // ViewARecord();
};

const Discrepant = (public_ip, gcc_cf_ip) => {
  const recordIdRoot = process.env['REC_ID_ROOT'];
  const recordIdWww = process.env['REC_ID_WWW'];
  const recordNameRoot = "gulfcoastcorgis.com";
  const recordNameWww = "www.gulfcoastcorgis.com";
  ChangeARecord(recordIdRoot, recordNameRoot, public_ip, gcc_cf_ip);
  ChangeARecord(recordIdWww, recordNameWww, public_ip, gcc_cf_ip);
  // Uncomment below after a cron has been set up to keep the script running (MAYBE)
  // ViewARecord();
};

const ViewARecord = async () => {
  const api_key = process.env['VIEW_API_TOKEN'];
  const email = "griffin.william@outlook.com";
  const zone_id = process.env['ZONE_ID'];

  const headers = {
    "X-Auth-Email": email,
    "X-Auth-Key": api_key,
    "Content-Type": "application/json",
  };

  const url = `https://api.cloudflare.com/client/v4/zones/${zone_id}/dns_records`;

  try {
    const response = await fetch(url, { headers });
    const dataObj = await response.json();

    if (dataObj.success) {
      const dns_records = dataObj.result;
      const a_name_record = dns_records.find(
        (record) => record.type === "A" && record.name === "gulfcoastcorgis.com"
      );
      let gcc_cloudflare_public_ip = a_name_record.content;
      IpChecker(gcc_cloudflare_public_ip);
    } else {
      console.error(`Data Object Error: ${dataObj.errors[0].message}`);
    }
  } catch (error) {
    console.error(`Error Viewing Records (C.F. API): ${error.message}`);
  }
};

const ChangeARecord = async (recordId, recordName, public_ip, gcc_cf_ip) => {
  const zone_id = process.env['ZONE_ID'];
  const apiKey = process.env['EDIT_API_TOKEN'];

  let date_time = new Date();
  let date = `${date_time.toDateString()}`;
  let time = `${date_time.toTimeString()}`;

  const recordType = "A";
  const recordContent = public_ip;
  const recordComment = `Change from: ${gcc_cf_ip} ${date} at ${time}`;

  const url = `https://api.cloudflare.com/client/v4/zones/${zone_id}/dns_records/${recordId}`;

  const data = JSON.stringify({
    type: recordType,
    name: recordName,
    content: recordContent,
//    content: public_ip,
    proxied: true,
    comment: recordComment,
  });

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: data,
    });
    const responseData = await response.json();
//    console.info('Response Data');
    console.info(responseData);
  } catch (error) {
    console.error(`Request Error Editing Records (C.F. API): ${error}`);
  }
};

ViewARecord();

