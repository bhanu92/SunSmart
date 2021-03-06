var express = require('express');
var router = express.Router();
var request = require('request');
var path = require('path');
var Device = require("../Models/devicesModel");
var DataModel = require("../Models/dataModel");
var UserModel = require("../Models/usersModel");
var PublicUserModel = require("../Models/publicUserModel");
var pass = require('../pass');
var fs = require('fs');
var deviceAPIKey = null;

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render(path.join(__dirname, '../views/mainpage'));
});

/* Register a Device */
router.post('/register', function(req, res, next) {
	var apikey = getNewApikey();
	
	if (req.body.deviceId == '' || req.body.email == '' || !req.body.email || !req.body.deviceId) {
		res.status(401).send({
			error: 'DeviceId and EmailId cannot be empty.'
		});
	}
	else {
		Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
			if (err) throw err;
			if (!device) {
				var newdevice = new Device({
					deviceId: req.body.deviceId,
					apikey: apikey,
					userEmail: req.body.email
				});
				
				newdevice.save(function(err) {
					if (err) {
						console.log(err.message);
						return res.status(401).send({error: 'Something went wrong. Please try again.'});
					}
					Device.find({ userEmail: req.body.email }, "deviceId", function(err, devices) {
						if (err) {
							console.log(err.message);
							return res.status(401).send({error: err.message});
						};
						res.status(201).send({
							deviceId: req.body.deviceId,
							apikey: apikey,
							devices: devices
						});
					});
				});
			}
			else {
				res.status(400).send({ error: 'Device with the same Id already exist' });
			}
		})
	}
});


router.get('/devices', function(req, res, next) {
	var email = req.query.email;
	
	if (email == undefined || email == null || email == '') {
		res.status(200).send({
			error: 'Email cannot be empty.'
		});
	}
	else {
		Device.find({
			userEmail: email
			}, "apikey deviceId", function(err, devices) {
			if (err) throw err;
			if (devices.length == 0) {
				res.status(200).send({
					error: 'No devices Found.'
				});
			}
			else {
				res.status(200).send({
					devices: devices
				});
			}
		});
	}
	
});

router.post('/deleteDevice', function(req, res, next) {
	var email = req.body.email;
	var deviceId = req.body.deviceId;
	
	if (email == undefined || email == null || email == '' || deviceId == undefined || deviceId == null || deviceId == '') {
		res.status(401).send({
			error: 'Email and deviceId cannot be empty.'
		});
	}
	else {
		Device.find({
			userEmail: email,
			deviceId: deviceId
			}, function(err, devices) {
			console.log(devices);
			if (err) throw err;
			if (devices.length == 0) {
				res.status(401).send({
					error: 'No devices Found.'
				});
			}
			else {
				Device.remove({
					userEmail: email,
					deviceId: deviceId
					}, function(err, result) {
					if (err) {
						res.status(401).send({
							error: 'No devices Found.'
						});
					}
					else {
						res.status(201).send({
							message: 'Device Successfully Deleted.'
						});
					}
				});
				
			}
		})
	}
	
});


router.get('/deviceData', function(req, res, next) {
	var deviceId = req.query.deviceId;
	
	if (deviceId == undefined || deviceId == null || deviceId == '') {
		res.status(200).send({
			error: 'DeviceId cannot be empty.'
		});
	}
	else {
		DataModel.find({
			deviceId: deviceId
			}, function(err, data) {
			if (err) throw err;
			if (data.length == 0) {
				res.status(200).send({
					error: 'No device data Found or Device is not Registered'
				});
			}
			else {
				res.status(200).send({
					data: data
				});
			}
		})
	}
});


router.get('/deviceData/latest', function(req, res, next) {
	var deviceId = req.query.deviceId;
	
	if (deviceId == undefined || deviceId == null || deviceId == '') {
		res.status(200).send({
			error: 'DeviceId cannot be empty.'
		});
	}
	else {
		DataModel.find({ deviceId: deviceId }).sort({ time: -1 }).exec(function(err, docs) {
			if (err) throw err;
			if (docs.length == 0) {
				//console.log(docs);
				res.status(200).send({
					error: 'No device data Found or Device is not Registered'
				});
			}
			else {
				res.status(200).send({
					data: docs[1]
				});
			}
		});
	}
});

// Get request for user details
router.get("/userDetails", function(req, res, next) {
	var userEmail = req.query.email;
	console.log(userEmail);
	if (userEmail == undefined || userEmail == null || userEmail == '') {
		res.status.send({
			error: 'User details cannot be retrieved'
		});
	}
	else {
		UserModel.findOne({
			email: userEmail
			}, function(err, data) {
			console.log(data);
			if (err) throw err;
			if (data.length == 0) {
				res.status(400).send({
					error: "No user found with email address \"" + userEmail + "\""
				});
			}
			else {
				//console.log("%s, %s", data.username, data.email);
				res.status(200).send({
					name: data.username,
					email: data.email
				});
			}
		});
	}
});

// Update user details
router.post("/updateUserDetails", function(req, res) {
	console.log(req.body);
	var name = req.body.name;
	var new_email = req.body.new_email;
	var old_email = req.body.old_email;
	var old_pwd = req.body.old_pwd;
	var new_pwd = req.body.new_pwd;
	var updateQuery = {
		email: old_email
	};
	UserModel.findOne(updateQuery, function(err, user) {
		if (err) {
			console.log(err.message);
			return res.status(201).send(err.message);
		}
		if (pass(old_pwd, user.password)) {
			var saveNew_pwd = pass(new_pwd);
			var newValues = {
				username: name,
				email: new_email,
				password: saveNew_pwd.hash,
				salt: saveNew_pwd.salt
			};
			UserModel.updateOne(updateQuery, newValues, function(err, result) {
				if (err) {
					console.log(err.message);
					return res.status(201).send(err.message);
				}
				
				res.status(200).send({
					message: "Successfully Updated",
					updated: true
				});
			});
		}
		else {
			//Send that old pwd is wrong
			res.status(200).send({
				message: "*You entered a wrong Password",
				updated: false
			})
		}
	});
	
});

//Get Device data.
router.post("/deviceData", function(req, res) {
	var responseJson = {
		status: "",
		message: {}
	};
	console.log(JSON.stringify(req.body));
	console.log('Latitude-'+ req.body.latitude + 'Longitude-'+ req.body.longitude);
	var errorFlag = false;
	
	// Ensure the POST data include required properties
	if (!req.body.hasOwnProperty("deviceId")) {
		responseJson.status = "ERROR";
		responseJson.message['deviceId'] = "Request missing deviceId parameter.";
		errorFlag = true;
	}
	if (req.body.deviceId != "320026000d51353432383931") {
		if (!req.body.hasOwnProperty("apikey")) {
			responseJson.status = "ERROR";
			responseJson.message['apikey'] = "Request missing apikey parameter.";
			errorFlag = true;
		}
	}
	if (!req.body.hasOwnProperty("longitude")) {
		responseJson.status = "ERROR";
		responseJson.message['longitude'] = "Request missing longitude parameter.";
		errorFlag = true;
	}
	if (!req.body.hasOwnProperty("latitude")) {
		responseJson.status = "ERROR";
		responseJson.message['latitude'] = "Request missing latitude parameter.";
		errorFlag = true;
	}
	if (!req.body.hasOwnProperty("uv")) {
		responseJson.status = "ERROR";
		responseJson.message['uv'] = "Request missing UV parameter.";
		errorFlag = true;
	}
	if (!req.body.hasOwnProperty("time")) {
		responseJson.status = "ERROR";
		responseJson.message['time'] = "Request missing time parameter.";
		errorFlag = true;
	}
	if (errorFlag) {
		console.log(responseJson);
		res.status(201).send(responseJson);
	}
	else {
		// Find the device and verify the apikey
		Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
			if (device != null) {
				if (device.apikey != req.body.apikey && req.body.deviceId != "320026000d51353432383931") { //TODO: Change the code here
					responseJson.status = "ERROR";
					responseJson.message['apikey'] = "Invalid apikey for device ID " + req.body.deviceId + ".";
					console.log(responseJson);
					res.status(201).send(responseJson);
				}
				else {
					
					var apikey = fs.readFileSync(__dirname + '/../apikeys/geocodeapikey.txt').toString();
					apikey = apikey.replace(/(\r\n|\n|\r)/gm, "");
					
					var longitude = req.body.longitude;
					var latitude = req.body.latitude;
					
					request({
						method: "GET",
						uri: "https://maps.googleapis.com/maps/api/geocode/json",
						qs: {
							latlng: parseFloat(latitude) + "," + parseFloat(longitude),
							key: apikey
						}
						}, function(error, response, body) {
						if(error){
							responseJson.status = "ERROR";
							responseJson.message['error'] = "Error in request.";
							return res.status(201).send(responseJson);
							console.log(error)
						}
						var data = JSON.parse(body);
						var zip_code = null;
						var city = null;
						if (data.status == "OK") {
							// Parse the response to find the ZIP code and city
							var zipFound = false, cityFound= false;
							for(var i in data.results){	
								if( zipFound &&  cityFound){
									break;
								}
								for (var addrComp of data.results[i].address_components) {
									if (addrComp.types[0] == "postal_code") {
										zip_code = addrComp.short_name;
										console.log(addrComp.short_name);
										zipFound = true;
									}
									if(addrComp.types[0] == "locality") {
										city = addrComp.long_name;
										console.log(addrComp.long_name);
										cityFound = true;
									}
									if( zipFound &&  cityFound){
										break;
									}
								}						
							}
							
							var dataModel = new DataModel({
								deviceId: req.body.deviceId,
								//apikey: req.body.apikey,
								latitude: req.body.latitude,
								longitude: req.body.longitude,
								uv: req.body.uv,
								city: city == null ? "Not Found" : city,
								zip: zip_code == null ? "Not Found" : zip_code,
								time: new Date(Date.parse(req.body.time))
							});
							
							dataModel.save(function(err) {
								if (err) {
									console.log(err.message);
									responseJson.status = "ERROR";
									responseJson.message['error'] = err.message;
									return res.status(201).send(responseJson);
								}
								responseJson.status = "OK";
								responseJson.message['success'] = "Device data has been saved!";
								res.status(201).send(responseJson);
								console.log("-----------------Saved to DB-----------------");
							});	
						}
						else{
							responseJson.status = "ERROR";
							responseJson.message['error'] = "Latitude or Longitude is incorrect.";
							return res.status(201).send(responseJson);
						}
					});					
					
				}
			}
			else {
				//console.log("Device ID " + req.body.deviceId + " not registered.");
				responseJson.status = "ERROR";
				responseJson.message['deviceId'] = "Device ID " + req.body.deviceId + " not registered.";
				res.status(201).send(responseJson);
			}
		});
	}
});

// Function to generate a random apikey consisting of 32 characters
function getNewApikey() {
	var newApikey = "";
	var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	
	for (var i = 0; i < 32; i++) {
		newApikey += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
	}
	
	return newApikey;
}

router.get("/.well-known/acme-challenge/Ll3mCA5lCX5OGZr3UH0yE5nVjOhxbZp0lcb3LgQwKso", function(req, res) {
	res.sendFile(path.join(__dirname, '../.well-known/acme-challenge/Ll3mCA5lCX5OGZr3UH0yE5nVjOhxbZp0lcb3LgQwKso'));
});

router.get('/forecast', function(req, res, next) {
	var responseJson = {
		uv: "Invalid",
		status: "ERROR"
	};
	var zip_code = null;
	//Import APIKEY
	var apikey = fs.readFileSync(__dirname + "/../apikeys/weatherbit.txt").toString(); // add directory
	apikey = apikey.replace(/(\r\n|\n|\r)/gm, "");
	
	if (req.query.hasOwnProperty("postal_code")) {
		zip_code = req.query.postal_code;
		if (isNaN(parseInt(zip_code))) {
			// Invalid ZIP code
			return res.status(401).send(responseJson);
		}
	}
	else {
		// Invalid query string
		responseJson = {
			error: "ZIP code missing"
		};
		return res.status(401).send(responseJson);
	}
	
	// Request to the third-party server
	request({
		method: "GET",
		uri: "https://api.weatherbit.io/v2.0/forecast/daily",
		qs: {
			postal_code: zip_code,
			key: apikey
		}
	},
    function(error, response, body) {
		if (error || (response && response.statusCode != 200)) {
			return res.status(401).send(responseJson);
		}
		else {
			if (body) {
				var data = JSON.parse(body);
				// Error handling for response
				if (data.hasOwnProperty("error")) {
					return res.status(401).send(data);
				}
				else {
					responseJson.uv = forecast(data.data);
					responseJson.status = "Success";
					res.status(200).send(responseJson);
				}
			}
			else {
				return res.status(401).send(responseJson);
			}
		}
	});
});

function forecast(data) {
	var weather = [];
	for (var i = 0; i < 5; i++) {
		var day = {};
		day["uv"] = data[i].uv;
		day["max_temp"] = data[i].max_temp;
		day["min_temp"] = data[i].min_temp;
		day["precip"] = data[i].precip;
		day["date"] = data[i].datetime;
		weather.push(day);
	}
	return weather;
}

router.get("/.well-known/acme-challenge/Ll3mCA5lCX5OGZr3UH0yE5nVjOhxbZp0lcb3LgQwKso", function(req, res) {
	res.sendFile(path.join(__dirname, '../.well-known/acme-challenge/Ll3mCA5lCX5OGZr3UH0yE5nVjOhxbZp0lcb3LgQwKso'));
});

router.get("/getDeviceData", function(req, res, next) {
	var _email = req.query.email;
	var deviceModelQuery = {
		userEmail: _email
	};
	Device.find(deviceModelQuery, function(err, deviceModelData) {
		if (err) {
			console.log(err.message);
			return res.status(201).send({"error": err.message});
		}
		else {
			if( deviceModelData.length != 0){
				var _deviceID = deviceModelData[0].deviceId;
				var start = new Date();
				start.setHours(0, 0, 0, 0);
				var end = new Date();
				end.setHours(23, 59, 59, 999);		
				var dataModelQuery = {
					$and: [ { deviceId: { $eq: _deviceID} }, { time: { $gte: start, $lt: end} }]
				};		
				DataModel.find(dataModelQuery, "time uv city zip" ,function(err, dataModelData) {
					if (err) {
						console.log(err.message);
						return res.status(201).send({"error" : err.message});
					}
					else {
					var avg = 0;
					for(var i in dataModelData){
						avg+=parseInt(dataModelData[i].uv);
					}
					var agg=avg;
					var averageUV = parseInt(avg/dataModelData.length);
						return res.status(201).send({ data: dataModelData, averageUV: averageUV, aggregateUV: agg});
					}
				});
			}
			else{
				return res.status(201).send({"error" : "No device found"});
			}
		}
	});
});

/* Register a Device */
router.post('/getPublicAPI', function(req, res, next) {
	var apikey = getNewApikey();
	
	if (req.body.email == '' || !req.body.email) {
		res.status(400).send({ error: 'Email cannot be empty.' });
	}
	else {
		PublicUserModel.findOne({ email: req.body.email }, function(err, user) {
			if (err) throw err;
			if (!user) {
				var publicUser = new PublicUserModel({
					apikey: apikey,
					email: req.body.email
				});
				
				publicUser.save(function(err) {
					if (err) {
						console.log(err.message);
						return res.status(400).send({ error: 'Something went wrong. Please try again.' });
					}
					PublicUserModel.find({ email: req.body.email}, function(err, userDetails) {
						if (err) {
							console.log(err.message)
						};
						//console.log(userDetails[0].apikey)
						res.status(201).send({ email: req.body.email, apikey: userDetails[0].apikey });
					});
				});
			}
			else {
				res.status(400).send({ error: 'Email with the same Id already exist' });
			}
		})
	}
});


//existingpublickey
router.get('/existingpublickey', function(req, res, next) {
	var email = req.query.email;
	
	if (email == undefined || email == null || email == '') {
		res.status(401).send({ error: 'Email cannot be empty.' });
	}
	else {
		PublicUserModel.findOne({ email: email }, function(err, userDetails) {
			if (err){
				//throw err;
				console.log(err);
			}
			if (!userDetails) {
				res.status(201).send({ error: 'No APIKEY Found.' });
			}
			else {
				res.status(200).send({ apikey: userDetails.apikey });
			}
		});
	}	
});

router.get("/deviceData/zip", function(req, res,next) {
    var zipCode = req.query.zipCode;
    var apikey = req.query.apikey;
    var responseJson = {
		status: "",
		message:"",
        averageUV: null  
	};
	
    if(zipCode == null || zipCode == undefined || zipCode == "") {
        responseJson.status = "ERROR";
        responseJson.message = "Request missing Zip code parameter.";
        res.status(200).send(responseJson);
	}
    else if(apikey == undefined || apikey == null || apikey == "") {
        responseJson.status = "ERROR";
        responseJson.message = "Request missing apikey parameter.";
        res.status(200).send(responseJson);
	}
    else {	
		PublicUserModel.findOne({ apikey: req.query.apikey }, function(err, userapikey) {
			if (userapikey !== null) {			
				DataModel.find({zipCode:req.query.zipCode},function(err,data){					
					if(err){ 
						//throw err;
						console.log("DB Error in Get zip");
					}
					if(!data) {
						responseJson.status="ERROR";
						responseJson.message="The zip Code does not match in our records.";
						res.status(401).send(responseJson);
					}
					else{
						var start = new Date();
						start.setHours(0, 0, 0, 0);
						var end = new Date();
						end.setHours(23, 59, 59, 999);		
						var dataModelQuery = {
							$and: [ { zip: { $eq: req.query.zipCode} }, { time: { $gte: start, $lt: end} }]
						}
						DataModel.find(dataModelQuery, "uv" ,function(err, dataModelData) {
							if (err) {
								console.log(err.message);
								responseJson.status="ERROR";
								responseJson.message="Invalid request. Please try again.";
								return res.status(401).send(responseJson);
							}
							if(dataModelData.length == 0){
								responseJson.status = "OK";
								responseJson.message="We do not have todays data logged for this Zip Code.";
								responseJson.averageUV = 0;
								return res.status(401).send(responseJson);
							}
							else {
								var avg= 0;
								for(var i in dataModelData){
									avg+=parseInt(dataModelData[i].uv);
								}
								console.log("Total UV value: "+ avg)
								console.log("Total value: "+ dataModelData.length)
								responseJson.status = "OK";
								responseJson.message="SUCCESS";
								responseJson.averageUV = parseInt(avg/dataModelData.length);
								return res.status(201).send(responseJson);
							}
						});						
					}
				});
			}
			else{
				responseJson.status = "ERROR";
				responseJson.message = "Invalid API Key.";
				res.status(201).send(responseJson);
			}
		})
	}
	
});

router.get("/deviceData/city", function(req, res,next) {
    var city = req.query.city;
    var apikey = req.query.apikey;
    var responseJson = {
		status: "",
		message:"",
        averageUV: null  
	};
	
    if(city == null || city == undefined || city == "") {
        responseJson.status = "ERROR";
        responseJson.message = "Request missing city parameter.";
        res.status(200).send(responseJson);
	}
    else if(apikey == undefined || apikey == null || apikey == "") {
        responseJson.status = "ERROR";
        responseJson.message = "Request missing apikey parameter.";
        res.status(200).send(responseJson);
	}
    else {	
		PublicUserModel.findOne({ apikey: req.query.apikey }, function(err, userapikey) {
			if (userapikey !== null) {			
				DataModel.find({ city : req.query.city},function(err,data){					
					if(err){ 
						//throw err;
						console.log("DB Error in Get zip");
					}
					if(!data) {
						responseJson.status="ERROR";
						responseJson.message="Given city does not match in our records.";
						res.status(401).send(responseJson);
					}
					else{
						var start = new Date();
						start.setHours(0, 0, 0, 0);
						var end = new Date();
						end.setHours(23, 59, 59, 999);		
						var dataModelQuery = {
							$and: [ { city: { $eq: req.query.city} }, { time: { $gte: start, $lt: end} }]
						}
						DataModel.find(dataModelQuery, "uv" ,function(err, dataModelData) {
							if (err) {
								console.log(err.message);
								responseJson.status="ERROR";
								responseJson.message="Invalid request. Please try again.";
								return res.status(401).send(responseJson);
							}
							if(dataModelData.length == 0){
								responseJson.status = "OK";
								responseJson.message="We do not have todays data logged for this city.";
								responseJson.averageUV = 0;
								return res.status(401).send(responseJson);
							}
							else {
								var avg= 0;
								for(var i in dataModelData){
									avg+= parseInt(dataModelData[i].uv);
								}
								console.log("Total UV value: "+ avg)
								console.log("Total value: "+ dataModelData.length)
								responseJson.status = "OK";
								responseJson.message="SUCCESS";
								responseJson.averageUV = parseInt(avg/dataModelData.length);
								return res.status(201).send(responseJson);
							}
						});						
					}
				});
			}
			else{
				responseJson.status = "ERROR";
				responseJson.message = "Invalid API Key.";
				res.status(201).send(responseJson);
			}
		})
	}
	
});



module.exports = router;