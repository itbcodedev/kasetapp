const axios = require('axios')
const csvjson = require('csvjson');
const readFile = require('fs').readFile;
const writeFile = require('fs').writeFile;
var exec = require('child_process').exec;
const moment = require('moment-timezone');
moment().tz("Asia/Bangkok").format();

const host = 'thingsboard.komomi.io';	
const username = 'tenant@thingsboard.org';	 
const password = '1234tenant';			
const device_id = "5f674790-7fab-11e9-aa10-8bae635062c0"
const startTs = moment('2019.7.28', 'YYYY.MM.DD').unix()*1000
const endTs = moment('2019.7.29', 'YYYY.MM.DD').unix()*1000

let token
const auth_url = `http://${host}/api/auth/login`
const key_url =  `http://${host}/api/plugins/telemetry/DEVICE/${device_id}/keys/attributes`
const key_feature =  `http://${host}/api/plugins/telemetry/DEVICE/${device_id}/keys/timeseries`
const value = `http://${host}/api/plugins/telemetry/DEVICE/${device_id}/values/timeseries?keys=`
var user = {
	'username': username,
	'password': password
};

getValue = async (headers,list_feature, startTs, endTs) => {
    const value_url = value + list_feature + `&startTs=${startTs}&endTs=${endTs}&interval=60000&limit=100&agg=AVG`
    const values = await axios.get(value_url, { headers: headers})
    return values.data
}

writeCSV = (filename, fileContent) => {
    //moment(1465297200000).format('MM-DD-YYYY HH:mm:ss')
    //"06-07-2016 06:00:00"
    const result = fileContent.map(obj => {
        return  { ts: moment(obj.ts).format('MM-DD-YYYY HH:mm:ss'), value: obj.value}
    })
    const csvData = csvjson.toCSV(result, {
        headers: 'key'
    });
    writeFile(filename, csvData, (err) => {
        if(err) {
            console.log(err);
            throw new Error(err);
        }
        console.log('Success!' + filename);
    });
}
main = async () => {
   try{
       const response =  await axios.post(auth_url,user)
       token = response.data.token
       const AuthStr = 'Bearer ' + token

       const headers = { 
        "Content-Type": "application/json",
        "X-Authorization": AuthStr
       }
       const keys = await axios.get(key_url, { headers: headers})
       //console.log(keys)

       const features = await axios.get(key_feature, { headers: headers})
       const list_feature = features.data.join();

       const data = await getValue(headers, list_feature,startTs,endTs)

       exec('rm -rf ' + __dirname + '/exports/*')

       Object.keys(data).forEach(key => {
            writeCSV(`./exports/${key}.csv`,data[key])
       })
       


   } catch (error) {
       console.log(error)
   }

   
}


main()