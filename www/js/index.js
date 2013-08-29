/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
 
var jsonObj = {}; // to store stuff

var pictureSource;   // picture source
var destinationType; // sets the format of returned value
var fs; // file system
var uri; // uri of current image
var fileToMove; // fileEntry of current image
var databaseFile;



var app = {
    // Application Constructor
    initialize: function() {
    	//alert("initialize");
        this.bindEvents();    
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener("resume", onResume, false);
        document.addEventListener("pause", onPause, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        //app.receivedEvent('deviceready');
        
        // access file system - on success create a directory to store content
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, onFileSystemFail);
        
        // camera stuff
        pictureSource = navigator.camera.PictureSourceType;
        destinationType = navigator.camera.DestinationType;
        
        // get current position
        navigator.geolocation.getCurrentPosition(onPositionSuccess, onPositionError);
        
        // get active challenges
        $.getJSON("http://underground-streams-dev.elasticbeanstalk.com/api/getActiveChallenges",
        	function(activeChallenges) {
        		jsonObj.activeChallenges = activeChallenges;
        		// populate the html of the weekly challenge page
        		var weeklyChallengeContent = "";
        		weeklyChallengeContent += '<h1>' + jsonObj.activeChallenges[0].title + '</h1>';
        		weeklyChallengeContent += '<p>' + jsonObj.activeChallenges[0].description + '</p>';
        		$("#weekly-challenge-content").append(weeklyChallengeContent);
        		//alert(activeChallenges);
        	}
        );
        
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

// onSuccess Callback
// This method accepts a Position object, which contains the
// current GPS coordinates
//
var onPositionSuccess = function(position) {
    alert('Latitude: '          + position.coords.latitude          + '\n' +
          'Longitude: '         + position.coords.longitude         + '\n' +
          'Altitude: '          + position.coords.altitude          + '\n' +
          'Accuracy: '          + position.coords.accuracy          + '\n' +
          'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
          'Heading: '           + position.coords.heading           + '\n' +
          'Speed: '             + position.coords.speed             + '\n' +
          'Timestamp: '         + position.timestamp                + '\n');
    
    
    // Find nearby stations
    // hard coded coordinates for testing
    // union square
    //$.getJSON("http://underground-streams-dev.elasticbeanstalk.com/api/nearbyStations?lat=40.735177&lon=-73.991675",
    // bronx 231 st
    //$.getJSON("http://underground-streams-dev.elasticbeanstalk.com/api/nearbyStations?lat=40.878932&lon=-73.904901",
    // real coordinates
    var str = "http://underground-streams-dev.elasticbeanstalk.com/api/nearbyStations?lat=" + position.coords.latitude + "&lon=" + position.coords.longitude;      
    $.getJSON(str, function(nearbyStations) {
        	jsonObj.nearbyStations = nearbyStations;
        	alert("nearest station " + jsonObj.nearbyStations[0].STOP_NAME);
        	// populate html of location page
        	var loc = document.getElementById('location-name');
        	loc.innerHTML = jsonObj.nearbyStations[0].STOP_NAME + "?";
        	var locBrowse = document.getElementById('location-browse');
        	locBrowse.innerHTML = jsonObj.nearbyStations[0].STOP_NAME;
        	
        	jsonObj.lines = new Array();
        	var submitLineDropdown = document.getElementById("submit-line");
        	var submitStopDropdown = document.getElementById("submit-stop");
        	var firstLine = false;
        	        	
        	// loop through all subway lines that stop at the nearest station and get list of stops for each line
        	// loop through all lines
        	//for (var i = 0; i < jsonObj.nearbyStations[0].Routes_ALL.length; i++)
        	// only get one line
        	for (var i = 0; i < 1; i++)
        	{
        		var line = jsonObj.nearbyStations[0].Routes_ALL[i];
        		// add line to dropdown on photo submit form
        		submitLineDropdown.add(new Option(line, line), null);
        		
        		// get the stops for each subway line    		
        		$.getJSON("http://underground-streams-dev.elasticbeanstalk.com/api/getStops/" + line,
        			function(stations) {
        				alert("Getting stops for "+ line + " line");
        				alert(line + " line " + stations.length + " stops);
        				jsonObj.lines.push({
        					line : line,			
        					stations : stations
        				});
        				
        				// add the stops for the first subway line to the dropdown on photo submit form
        				if (firstLine == false)
        				{
        					for (var k = 0; k < jsonObj.lines[0].stations.length; k++)
        					{
        						var stationName = jsonObj.lines[0].stations[k].NAME_CUR;
        						var stationId = jsonObj.lines[0].stations[k].STOP_ID;
        						submitStopDropdown.add(new Option(stationName, stationId), null);
        						// pre-select the nearest stop in the dropdown
        						if (stationId === jsonObj.nearbyStations[0].STOP_ID)
        						{
        							submitStopDropdown.options[k].selected = true;
        						}
        					}
        					firstLine = true;
        				}
        		});	
        	}
        	
        	// testing dropdown
        	//submitLineDropdown.add(new Option("L", "L"), null);
        	
        	// pre-select the first subway line in the dropdown
        	submitLineDropdown.options[0].selected = true;
        	/*
        	// loop through nearby stations and get content
        	for (var j=0; j<jsonObj.nearbyStations.length; j++)
			{
				var url = "http://underground-streams-dev.elasticbeanstalk.com/api/getContentByStop/" + jsonObj.nearbyStations[j].STOP_ID;
				$.getJSON(url,
					function(stationContent) {
						for (var m=0; m<jsonObj.nearbyStations.length; m++)
						{
							if(stationContent[0].stop_ID == jsonObj.nearbyStations[m].STOP_ID)
							{
								jsonObj.nearbyStations[m].content = stationContent;
							}
						}	
				});
			}*/
        		
    }); // end getNearbyStations callback
    
}; // end onPositionSuccess

// onError Callback receives a PositionError object
//
function onPositionError(error) {
    alert('position error code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
}

function launchCamera() {
	navigator.camera.getPicture(onCameraSuccess, onCameraFail, { quality: 50,
		destinationType: destinationType.FILE_URI
	});	
}

// when photo is taken, navigate to submit page and display photo
function onCameraSuccess(imageURI) {
    var image = document.getElementById('previewImg');
    image.style.display = 'block';
    image.src = imageURI;
    uri = imageURI;
    window.location.hash = "#participate-submit";
}

function onCameraFail(message) {
   	alert('Failed because: ' + message);
}

// user clicks submit, retrieve fileEntry from the uri
function submitPhoto() {
	window.resolveLocalFileSystemURI(uri, onResolveSuccess, onResolveFail);
}

// get directory where file will be moved to ("underground-streams-test")
function onResolveSuccess(fileEntry) {
    fileToMove = fileEntry;
    fs.root.getDirectory("underground-streams-test", {create: true, exclusive: false}, onMoveFile, onMoveFileFail);
}

function onResolveFail(evt) {
    alert("resolve fail error code " + evt.target.error.code);
}

// move the file
function onMoveFile(dir) {
	//alert("moving file to " + dir.name);
	fileToMove.moveTo(dir, fileToMove.name, onFileMoveSuccess, onFileMoveFail);
}

function onMoveFileFail(error) {
	alert("error moving file " + error);
}

// after file is moved, try to immediately upload it
function onFileMoveSuccess(entry) {
    uploadFile(entry);
}

function onFileMoveFail(error) {
    alert(error.code);
}

// upload file to server using ajax - this doesn't work
function uploadFile2(entry) {
	alert("upload file " + entry.name);
	//var theFile;
	entry.file(function(f) {
					alert("f name " + f.name);
					alert("f full path " + f.fullPath);
					
					var request = new XMLHttpRequest();
					request.open("POST", "http://underground-streams-dev.elasticbeanstalk.com/api/uploadContent", true);	
					
			   		request.onreadystatechange=function() {
  						if (request.readyState==4 && request.status==200)
    					{
    						alert("success: " + request.responseText);
    					}
    					else
    					{
    						alert(request.responseText);
    					}
  					};
  						
  					//alert("theFile name " + theFile.name);
  					var formdata = new FormData();
  					formdata.append("userContent", entry, entry.name);
  					formdata.append("title", "testUpload");
  					formdata.append("subwayStop", "104");
  					formdata.append("subwayLine", "1");
  					formdata.append("challengeID", "521248324138b08c6c000005");
  					//formdata.append("user", "testUser");
  	
  					request.send(formdata);
			   
			   },
			   function(err) {
			   		alert(err);
			   }
	);
	
	
	//var request = new XMLHttpRequest();
	//request.open("POST", "http://underground-streams-dev.elasticbeanstalk.com/api/uploadContent", true);
	
	
	
	/*request.onreadystatechange=function() {
  		if (request.readyState==4 && request.status==200)
    	{
    		alert("success: " + request.responseText);
    	}
    	alert("fail: " + request.responseText);
  	};*/
  	
  	/*var files = {
  		userContent: {
  			filename: entry.name,
  			path: entry.name.substring(0, entry.name.lastIndexOf('/')+1),
  			type: "image/jpeg"
  		}
  	};*/
  	/*alert("theFile name " + theFile.name);
  	var formdata = new FormData();
  	formdata.append("userContent", theFile, theFile.name);
  	formdata.append("title", "testUpload");
  	formdata.append("subwayStop", "104");
  	formdata.append("subwayLine", "1");
  	formdata.append("challengeID", "521248324138b08c6c000005");
  	//formdata.append("user", "testUser");
  	
  	request.send(formdata);*/
	
}

// Upload files to server using FileTransfer
function uploadFile(entry) {
    
    var options = new FileUploadOptions();
    options.fileKey="userContent";
    options.fileName="testfilename.jpg";
    options.mimeType="image/jpeg";

    var params = new Object();
    params.title = document.getElementById("submit-title").value;
  	params.subwayLine = document.getElementById("submit-line").value;
  	params.subwayStop = document.getElementById("submit-stop").value;
  	params.challengeID = jsonObj.activeChallenges[0]._id;

    options.params = params;
    options.chunkedMode = false;
    
    var ft = new FileTransfer();
    ft.upload( entry.fullPath, encodeURI("http://underground-streams-dev.elasticbeanstalk.com/api/uploadContent"),
        function(result) {
			//upload successful
			alert("upload success");      
        },
        function(error) {
            //upload unsuccessful, error occured while upload. 
            alert("upload fail");
            alert("error code: " + error.code + "\nerror source: " + error.source + "\nerror target: " + error.target);
        },
        options
        );
}

// on first open, create directory to hold ug-streams content
function onFileSystemSuccess(fileSystem) {
	fs = fileSystem;
	var entry = fs.root;
    entry.getDirectory("underground-streams-test", {create: true, exclusive: true}, onGetDirectorySuccess, onGetDirectoryFail);
}

function onFileSystemFail(evt) {
    alert("file system error code " + evt.target.error.code);
}

function onGetDirectorySuccess(dir) { 
      //alert("Created dir "+dir.name); 
} 

function onGetDirectoryFail(error) { 
     //alert("Error creating directory "+error.code);
     if (error.code == 12)
     {
     	//alert("file path already exists");
     }
}

// populate html with content
function loadBrowseContent() {
	var challengeTitle = jsonObj.activeChallenges[0].title;
	var stopName = jsonObj.nearbyStations[0].STOP_NAME;
	var lines = "";
	for (var s = 0; s < jsonObj.nearbyStations[0].Routes_ALL.length; s++)
	{
		lines += " ";
		lines += jsonObj.nearbyStations[0].Routes_ALL[s];
	}
	
	var browseModeDropdown = "";
	browseModeDropdown += '<li>' + challengeTitle + ' #' + stopName + '</li>';
	browseModeDropdown += '<li>' + challengeTitle + lines;
	
	$("#browse-mode-dropdown").append(browseModeDropdown);
	
	var s3path = "http://undegroundstream_videos.s3.amazonaws.com/";
	var text = "";
	for (var i = 0; i < jsonObj.nearbyStations[0].content.length; i++)
	{
		//alert(i);
		text += '<div class="span3">';
		text += '<img src=' + s3path + jsonObj.nearbyStations[0].content[i].url + ' width = "20%">';
		text += '<h3>' + jsonObj.nearbyStations[0].content[i].title + '</h3>';
		text += '<p>comments(' + jsonObj.nearbyStations[0].content[i].comments.length + ')</p>';
		text += '<br/>';
		text += '<img src="images/lines/' + jsonObj.nearbyStations[0].content[i].line + '.png" />';
		text += '</div>';
	
	}
	$("#browse-content").append(text);
	
}

function onResume() {
	alert("resume ");
}

function onPause() {
	alert("pause");
}








