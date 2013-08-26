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
        		//jsonObj.activeChallenges = JSON.parse(activeChallenges);
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
    /*alert('Latitude: '          + position.coords.latitude          + '\n' +
          'Longitude: '         + position.coords.longitude         + '\n' +
          'Altitude: '          + position.coords.altitude          + '\n' +
          'Accuracy: '          + position.coords.accuracy          + '\n' +
          'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
          'Heading: '           + position.coords.heading           + '\n' +
          'Speed: '             + position.coords.speed             + '\n' +
          'Timestamp: '         + position.timestamp                + '\n');*/
    
    // real coordinates
    var str = "http://underground-streams-dev.elasticbeanstalk.com/api/nearbyStations?lat=" + position.coords.latitude + "&lon=" + position.coords.longitude;      
    //alert(str);
    $.getJSON(str,
    // hard coded coordinates for testing
    // union square
    //$.getJSON("http://underground-streams-dev.elasticbeanstalk.com/api/nearbyStations?lat=40.735177&lon=-73.991675",
    //$.getJSON("http://underground-streams-dev.elasticbeanstalk.com/api/nearbyStations?lat=40.878932&lon=-73.904901",
        function(nearbyStations) {
        	jsonObj.nearbyStations = nearbyStations;
        	//jsonObj.nearbyStations = JSON.parse(nearbyStations);
        	alert("nearest station " + jsonObj.nearbyStations[0].STOP_NAME);
        	//var lines = new Array();
        	var loc = document.getElementById('location-name');
        	loc.innerHTML = jsonObj.nearbyStations[0].STOP_NAME + "?";
        	var locBrowse = document.getElementById('location-browse');
        	locBrowse.innerHTML = jsonObj.nearbyStations[0].STOP_NAME;
        	jsonObj.lines = new Array();
        	var submitLineDropdown = document.getElementById("submit-line");
        	var submitStopDropdown = document.getElementById("submit-stop");
        	var firstLine = false;
        	for (var i = 0; i < jsonObj.nearbyStations[0].Routes_ALL.length; i++)
        	{
        		//alert(jsonObj.nearbyStations[0].Routes_ALL[i]);
        		var line = jsonObj.nearbyStations[0].Routes_ALL[i];
        		submitLineDropdown.add(new Option(line, line), null);
        		     		
        		//var url = "http://underground-streams-dev.elasticbeanstalk.com/api/getStationsByLine/" + line;
        		
        		//$.getJSON("http://underground-streams-dev.elasticbeanstalk.com/api/getStops/" + line,
        		$.getJSON("http://underground-streams-dev.elasticbeanstalk.com/api/getStops/" + line,
        			function(stations) {
        				//var apiData = JSON.parse(stations);
        				alert(line);
        				alert(stations.length);
        				//lines.push(line);
        				jsonObj.lines.push({
        					line : line,			
        					stations : stations
        				});
        				//alert(jsonObj.lines[0].line);
        				//alert(jsonObj.lines[0].stations.length);
        				//alert(jsonObj.lines[0]);
        				
        				
        				if (firstLine == false)
        				{
        					for (var k = 0; k < jsonObj.lines[0].stations.length; k++)
        					{
        						var stationName = jsonObj.lines[0].stations[k].NAME_CUR;
        						var stationId = jsonObj.lines[0].stations[k].STOP_ID;
        						submitStopDropdown.add(new Option(stationName, stationId), null);
        						if (stationId === jsonObj.nearbyStations[0].STOP_ID)
        						{
        							alert(stationId);
        							submitStopDropdown.options[k].selected = true;
        						}
        					}
        					firstLine = true;
        				}
        				
        			}
        		);
        		//alert(jsonObj.lines[i].line);
        	}
        	
        	//alert(jsonObj.lines.length);
        	//alert("hello1");
        	submitLineDropdown.add(new Option("L", "L"), null);
        	//alert("hello2");
        	submitLineDropdown.options[0].selected = true;
        	//alert("hello3");
        	//var submitStopDropdown = document.getElementById("submit-stop");
        	//alert("stations length " + jsonObj.lines[0].stations.length);
        	//alert("hello4");
        	/*for (var k = 0; k < jsonObj.lines[0].stations.length; k++)
        	{
        		var stationName = jsonObj.lines[0].stations[k].NAME_CUR;
        		var stationId = jsonObj.lines[0].stations[k].STOP_ID;
        		submitStopDropdown.add(new Option(stationName, stationId), null);
        	}*/
        	
        	for (var j=0; j<jsonObj.nearbyStations.length; j++)
			{
				//alert(nearbyStations[j].STOP_NAME);
				var url = "http://underground-streams-dev.elasticbeanstalk.com/api/getContentByStop/" + jsonObj.nearbyStations[j].STOP_ID;
				$.getJSON(url,
					function(stationContent) {
						//alert(stationContent[0].url);
						for (var m=0; m<jsonObj.nearbyStations.length; m++)
						{
							if(stationContent[0].stop_ID == jsonObj.nearbyStations[m].STOP_ID)
							{
								jsonObj.nearbyStations[m].content = stationContent;
								//alert(jsonObj.nearbyStations[m].content[0].url);
							}
						}	
							
					}
				);
			}
        		
        }
    );
    
};

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
	//alert("camera success " + imageURI);
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
    //alert("resolve success: " + fileEntry.fullPath);
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
    //alert("New Path: " + entry.fullPath);
    //uploadFile(entry);
    
    uploadFile(entry);
}

function onFileMoveFail(error) {
    alert(error.code);
}

// upload file to server using ajax
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
    //params.title = "testUpload";
    params.title = document.getElementById("submit-title").value;
  	//params.subwayLine = "1";
  	params.subwayLine = document.getElementById("submit-line").value;
  	//params.subwayStop = "104";
  	params.subwayStop = document.getElementById("submit-stop").value;
  	//params.challengeID = "521248324138b08c6c000005";
  	params.challengeID = jsonObj.activeChallenges[0]._id;

    options.params = params;
    options.chunkedMode = false;
    
    var ft = new FileTransfer();
    ft.upload( entry.fullPath, encodeURI("http://underground-streams-dev.elasticbeanstalk.com/api/uploadContent"),
        function(result) {
			//upload successful
			alert("upload success");
			//alert(result.bytesSent); 
			//alert(result.responseCode);
			//alert(result.response);       
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
    //alert(fileSystem.name);
    //alert(fileSystem.root.name);
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

function loadBrowseContent() {
	alert(jsonObj.nearbyStations[0].content.length + " photos");
	var s3path = "http://undegroundstream_videos.s3.amazonaws.com/";
	var text = "";
	for (var i = 0; i < jsonObj.nearbyStations[0].content.length; i++)
	{
		alert(i);
		text += '<div class="span3">';
		text += '<img src=' + s3path + jsonObj.nearbyStations[0].content[i].url + ' width = "20%">';
		text += '</div>';
	
		/* <div class="span3">
		<img src="images/train.png" width="20%">
		<h3>Title</h3>
		<p>Comments</p>
		<img src="images/lines/1.png"> */
	}
	$("#browse-content").append(text);
	
}








