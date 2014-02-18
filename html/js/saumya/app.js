
//customise the app
(function(){
	//var gui = require('nw.gui');
	/*
	//resize
	var win = gui.Window.get();
	//win.resizeTo(200, 200);//size
	win.resizeBy(200,200);//percentage
	*/
	/*
	// Get the current window
	var win = gui.Window.get();
	var w = window.screen.width - 500;
	var h = window.screen.height - 500;
	//move to bottom right cornor of screen
	win.moveTo(w,h);
	*/
	
	/*
	var gui = require('nw.gui');
	//gui.App.quit();
	//gui.App.manifest.name;
	// Create a tray icon
	//var tray = new gui.Tray({ title: 'S3 Sync', icon: 'icon.png' });
	var tray = new gui.Tray({ icon: 'icon.png' });
	// Give it a menu
	var menu = new gui.Menu();
	menu.append(new gui.MenuItem({ type: 'checkbox', label: 'box1' }));
	tray.menu = menu;
	*/
	//clear data
	//localStorage.clear();	
	//finally make the window visible
	//win.show();
})();

//
//
//once everything is up
$(function(){
	myS3.initialize();
});

var myS3 = {
	init: function(){
		console.log('init');
	},
	saveTo: function(key,value){
		localStorage.setItem(key,value);
	},
	getFrom: function(key){
		var value = localStorage.getItem(key);
		return value;
	},
	checkLocalStorage: function(){
		try {
		    return 'localStorage' in window && window['localStorage'] !== null;
		  } catch (e) {
		    return false;
		  }
	},
	initialize: function(){
		var that = this;
		//
		this.pathModule = require('path');
		that.fs = require('fs');
		//
		var accKey1 = that.getFrom('accKey');
		var secAccKey1 =  that.getFrom('secAccKey');
		var bucketName1 = that.getFrom('bucketName');
		var folderPath1 = that.getFrom('folderPath');
		
		if((accKey1||secAccKey1||bucketName1)===null){
			//DO Nothing
			console.log('No Stored data : First time');
			that.changePageTo("#configureAWS");
		}else{
			if((accKey1==='') || (secAccKey1==='') || (bucketName1==='') || (folderPath1==='')){
				that.changePageTo("#configureAWS");
			}else{
				that.initAWS(accKey1,secAccKey1,bucketName1);
			}
		}
		
		//that.changePageTo("#configureAWS");
		//that.changePageTo("#configureDrive");
		
		//adding event handler
		$('#idBtnDone').on('click',that,that.onDoneS3Config);
		$('#idBtnFolderDone').on('click',that,that.onDoneFolder);
		//update config
		$('#idUpdateBtnDone').on('click',that,that.onDoneUpdateS3Config);
		$('#idUpdateBtnFolderDone').on('click',that,that.onDoneUpdateFolder);
	},
	onDoneS3Config: function(event){
		event.preventDefault();
		var scope = event.data;
		var accKey = $('#idTxtAKey').val();
		var secAccKey = $('#idTxtSecAKey').val();
		var bucketName = $('#idTxtBucket').val();
		if((accKey==='')||(secAccKey==='')||(bucketName==='')){
			//alert('Fill up everything');
			$( "#idPopUp_1" ).popup( "open" );
		}else{
			scope.saveTo('accKey',accKey);
			scope.saveTo('secAccKey',secAccKey);
			scope.saveTo('bucketName',bucketName);
			scope.initAWS(accKey,secAccKey,bucketName);
		}
		//finally return
		return false;
	},
	onDoneFolder: function(event){
		event.preventDefault();
		var scope = event.data;
		//console.log(event.data);
		var folderPath = $('#idTxtFolder').val();
		//$('#idSystemInfo').val('Ready!');
		
		if(folderPath===''){
			//alert('Please put the folder path.');
			$( "#idPopUp_2" ).popup( "open" );
		}else{
			scope.saveTo('folderPath',folderPath);
			scope.initChokidar(folderPath);
		}
		return false;
	},
	onDoneUpdateS3Config: function(event){
		event.preventDefault();
		var scope = event.data;
		var accKey = $('#idUpdateTxtAKey').val();
		var secAccKey = $('#idUpdateTxtSecAKey').val();
		var bucketName = $('#idUpdateTxtBucket').val();
		if((accKey==='')||(secAccKey==='')||(bucketName==='')){
			//alert('Fill up everything');
			$( "#idUpdatePopUp_1" ).popup( "open" );
		}else{
			scope.saveTo('accKey',accKey);
			scope.saveTo('secAccKey',secAccKey);
			scope.saveTo('bucketName',bucketName);
			scope.initAWS(accKey,secAccKey,bucketName);
		}
		//finally return
		return false;
	},
	onDoneUpdateFolder: function(event){
		event.preventDefault();
		var scope = event.data;
		//console.log(event.data);
		var folderPath = $('#idUpdateTxtFolder').val();
		//$('#idSystemInfo').val('Ready!');
		
		if(folderPath===''){
			//alert('Please put the folder path.');
			$( "#idUpdatePopUp_2" ).popup( "open" );
		}else{
			scope.saveTo('folderPath',folderPath);
			scope.initChokidar(folderPath);
		}
		return false;
	},
	initAWS: function(ak,sak,bn){
		var that = this;
		console.log('initAWS');
		console.log(ak);
		console.log(sak);
		console.log(bn);
		//$.mobile.loading( "show", {text: "Connecting",textVisible:true,theme:"b"});
		that.showMessage("Connecting");
		
		AWS.config.update({accessKeyId: ak, secretAccessKey: sak});
		//AWS.config.region = 'us-west-1';
		//var s3 = new AWS.S3({region: 'us-west-1', maxRetries: 15});
		
		new AWS.S3().listObjects({Bucket: bn}, function(error, data) {
		  if (error) {
		  	console.log('ERROR');
		    console.log(error); // an error occurred
		    that.changePageTo("#configureAWS");
		  } else {
		  	console.log('SUCCESS');
		    console.log(data); // request succeeded
		    //get from localstorage
		    var folderPath1 = that.getFrom('folderPath');
		    if(folderPath1===null){
		    	that.configDrive();
		    }else{
		    	that.initChokidar(folderPath1);
		    }
		  }
		  $.mobile.loading( "hide");
		});
		
	},
	configDrive: function(){
		this.changePageTo("#configureDrive");
	},
	initChokidar: function(folderPath){
		console.log('initChokidar : '+folderPath);
		this.changePageTo("#autoSync");
		//
		var bucketName1 = this.getFrom('bucketName');
		var folderPath1 = this.getFrom('folderPath');
		$("#lS3Bucket").val(bucketName1);
		$("#lFolder").val(folderPath1);

		var that = this;//save the scope
		var folder = folderPath;
		//
		var chokidar = require('chokidar');
		var watcher = chokidar.watch(folder, {ignored: /[\/\\]\./, persistent: true});
		/*
		  watcher
		    .on('add', function(path) {console.log('File', path, 'has been added');})
		    .on('addDir', function(path) {console.log('Directory', path, 'has been added');})
		    .on('change', function(path) {console.log('File', path, 'has been changed');})
		    .on('unlink', function(path) {console.log('File', path, 'has been removed');})
		    .on('unlinkDir', function(path) {console.log('Directory', path, 'has been removed');})
		    .on('error', function(error) {console.error('Error happened', error);})
		*/
		  // 'add', 'addDir' and 'change' events also receive stat() results as second argument.
		  // http://nodejs.org/api/fs.html#fs_class_fs_stats
		  // ****************** stats ****** not reliable
		watcher.on('add', function(path) {
			that.uploadFile(path);
		});
		watcher.on('change', function(path) { 
			that.uploadFile(path);
		});
	},
	uploadFile: function(path){
		console.log('uploadFile:'+path);
		$('#idSystemInfo').val(path);
		//this.showMessage('Uploading file to S3');

		var dirname = this.pathModule.dirname(path);
		//var fileName = this.pathModule.basename(path);
		
		//get the config path
		var configFolderPath = this.getFrom('folderPath');
		var objNameToUpload = this.pathModule.relative(configFolderPath,path);
		
		
		//var objNewNameToUpload = objNameToUpload.replace("\\", "/", "gi");
		var objArray = objNameToUpload.split(this.pathModule.sep);
		var objNewNameToUpload = objArray.join("/");

		console.log('objNameToUpload :'+objNameToUpload);
		console.log('objNewNameToUpload :'+objNewNameToUpload);

		//console.log('dirname :'+dirname);
		//console.log('dirname AfterRel :'+this.pathModule.dirname(objNameToUpload));
		/*
		console.log('===============================================================');
		console.log('fileName :'+fileName);
		//console.log('dirname :'+dirname);
		//console.log('dirname :'+this.pathModule.basename(dirname));
		//console.log('relative :'+this.pathModule.relative(fileName,configFolderPath));
		console.log('confPath :'+configFolderPath);
		console.log('path :'+path);
		console.log('relative :'+this.pathModule.relative(configFolderPath,path));
		//console.log('path :'+path);
		console.log('===============================================================');
		*/
		
		var that = this;
		that.fs.readFile(path, function (err, data) {
		  	if(err===null){
			  	console.log('READ FILE : DONE');
			  	//Put in Amazon S3  
			  	var bucketName = that.getFrom('bucketName');
				//var params = {Key:fileName, ContentType: 'file', Body: data}; 
				//var params = {Key:objNameToUpload, ContentType: 'file', Body: data}; 
				var params = {Key:objNewNameToUpload, ContentType: 'file', Body: data}; 

				//var params = {Key: file.name, ContentType: file.type, Body: file};
				var s3Bucket = new AWS.S3({params: {Bucket: bucketName}});
				s3Bucket.putObject(params, function (err, result) {
					//results.innerHTML = err ? 'ERROR!' : 'UPLOADED.'; 
					if(err===null){
						console.log(result);
						$.mobile.loading( "hide"); 
					}else{
						console.log(err);
						that.showMessage('ERROR');
					} 
				});
			//END S3
		  	}else{
		  		console.log('READ FILE : ERROR');
		  		console.log(err); 
		  	}
		});
		
		

	},
	showMessage: function(msg){
		$.mobile.loading( "show", {text: msg,textVisible:true,theme:"b"});
	},
	changePageTo: function(pageID){
		$.mobile.pageContainer.pagecontainer("change", pageID, { reload:true, transition:'flow', changeHash:true });
		//$(":mobile-pagecontainer").pagecontainer("change", "target", { options });
		//$.mobile.pageContainer.pagecontainer("change", "target", { options });
		//$("body").pagecontainer("change", "target", { options });
		return false;
	},
	destroy: function(){
		console.log('destroy');
	}
};