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
    //$.getJSON("http://underground-streams-dev.elasticbeanstalk.com/api/nearbyStations?lat=40.878932&lon=-73.904901",
        function(nearbyStations) {
        	jsonObj.nearbyStations = nearbyStations;
        	alert("nearest station " + jsonObj.nearbyStations[0].STOP_NAME);
        	for (var i=0; i<jsonObj.nearbyStations.length; i++)
			{
				var url = "http://underground-streams-dev.elasticbeanstalk.com/api/getContentByStop/" + jsonObj.nearbyStations[i].STOP_ID;
				$.getJSON(url,
					function(stationContent) {
							// populate jsonObj with station content	
							
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
    uploadFile(entry);
}

function onFileMoveFail(error) {
    alert(error.code);
}

// upload file to server using ajax
function uploadFile(entry) {
	alert("upload file " + entry.name);
	var theFile = new File();
	entry.file(function(f){alert(f.name); theFile = f;}, function(err){alert(err);});
	var request = new XMLHttpRequest();
	request.open("POST", "http://underground-streams-dev.elasticbeanstalk.com/api/uploadContent", true);
	
	request.onreadystatechange=function() {
  		if (request.readyState==4 && request.status==200)
    	{
    		alert("success: " + request.responseText);
    	}
    	alert("fail: " + request.responseText);
  	};
  	
  	/*var files = {
  		userContent: {
  			filename: entry.name,
  			path: entry.name.substring(0, entry.name.lastIndexOf('/')+1),
  			type: "image/jpeg"
  		}
  	};*/
  	alert(theFile.name);
  	var formdata = new FormData();
  	formdata.append("userContent", theFile, theFile.name);
  	formdata.append("title", "testUpload");
  	formdata.append("subwayStop", "104");
  	formdata.append("subwayLine", "1");
  	formdata.append("challengeID", "521248324138b08c6c000005");
  	//formdata.append("user", "testUser");
  	
  	request.send(formdata);
	
}

// Upload files to server using FileTransfer
/*function uploadFile2(mediaFile) {
    path = mediaFile.fullPath;
    name = mediaFile.name;
    
    var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName=mediaFile.name;
    options.mimeType="image/jpeg";

    var params = new Object();
    params.fullpath = path;
    params.name = name;

    options.params = params;
    options.chunkedMode = true;
    
    var ft = new FileTransfer();
    ft.upload( path, "http://underground-streams-dev.elasticbeanstalk.com/api/uploadContent",
        function(result) {
			//upload successful
			alert("upload success");           
        },
        function(error) {
            //upload unsuccessful, error occured while upload. 
            alert("upload fail");
        },
        options
        );
}*/

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
     alert("Error creating directory "+error.code);
     if (error.code == 12)
     {
     	alert("file path already exists");
     }
}








