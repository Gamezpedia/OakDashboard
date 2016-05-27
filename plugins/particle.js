(function()
{


	// ## Styles
	freeboard.addStyle('.button-widget-button', 'text-transform: uppercase; opacity: 0.8; display: block; padding: 15px; background: #444; color: white; font-weight: 100; font-size: 20px; line-height:20px; text-align: center; -webkit-transition: opacity 0.25s; transition: opacity 0.25s;');
	freeboard.addStyle('.button-widget-button:hover', 'opacity: 1; text-decoration: none; color: white;');

	// ## Helper methods
	function formatValue(value, type)
	{
		switch(type.toUpperCase())
		{
			case "BOOLEAN":
			case "BOOL":
				return value.toLowerCase() === "true" || value == "1";
				break;
			case "INT":
			case "DOUBLE":
			case "NUMBER":
				return Number(value);
				break;
			case "JSON":
				try
				{
					return JSON.parse(value);
				}
				catch(e)
				{
					return {};
				}
				break;
			default:
				return String(value);
				break;
		}
	}

	var particleApiSettings = [
		{
			"name"        : "device_id",
			"display_name": "Device ID",
			"type"        : "option",
			"options"	  : particle_devices,
			"required"	  : true
		}
	];

	// ## Function Datasource
	freeboard.loadDatasourcePlugin({
		"type_name"   : "particle_function",
		"display_name": "Particle Function",
       	"description" : "A datasource calling a Particle device function and returning the result.",
		"settings"    : _.union(particleApiSettings, [
			,
			{
				"name"        : "function_name",
				"display_name": "Function Name",
				"type"        : "text",
				"required"	  : true
			},
			{
				"name"        : "function_args",
				"display_name": "Function Arguments",
				"type"        : "calculated",
				"required"	  : false
			},
			{
				"name"         : "refresh_time",
				"display_name" : "Refresh Time",
				"type"         : "text",
				"description"  : "In seconds",
				"default_value": 5
			}
		]),
		newInstance   : function(settings, newInstanceCallback, updateCallback)
		{
			newInstanceCallback(new particleFunctionDatasourcePlugin(settings, updateCallback));
		}
	});

	var particleFunctionDatasourcePlugin = function(settings, updateCallback)
	{
		var self = this;

		var currentSettings = settings;

		var refreshTimer;

		function getData()
		{
			$.ajax({
					url  : "https://api.particle.io/" + 'v1' + "/devices/" + currentSettings.device_id + "/" + currentSettings.function_name,
					type : "POST",
					data : {'args':currentSettings.function_args},
					beforeSend: function(xhr)
					{
						try
						{
							xhr.setRequestHeader("Authorization", "Bearer " + particle_token);
						}
						catch(e)
						{
						}
					},
					success   : function(data)
					{
						updateCallback(formatValue(data.result, "NUMBER"));
					},
					error     : function(xhr, status, error)
					{
						//console.log(error);
					}
				});

		}

		function initEventSource(interval)
		{
			interval = interval*1000;
			if(refreshTimer)
			{
				clearInterval(refreshTimer);
			}

			refreshTimer = setInterval(function()
			{
				// Here we call our getData function to update freeboard with new data.
				getData();

			}, interval);
		}

		function destroyEventSource()
		{
			if(refreshTimer)
			{
				clearInterval(refreshTimer);
			}
		}

		self.onSettingsChanged = function(newSettings)
		{
			destroyEventSource();

			currentSettings = newSettings;

			initEventSource(currentSettings.refresh_time);
		}

		self.updateNow = function()
		{
			getData();
		}

		self.onDispose = function()
		{
			destroyEventSource();
		}

		initEventSource(currentSettings.refresh_time);
	}

	// ## Variable Datasource
	freeboard.loadDatasourcePlugin({
		"type_name"   : "particle_variable",
		"display_name": "Particle Variable",
       	"description" : "A datasource fetching a Particle device variable.",
		"settings"    : _.union(particleApiSettings, [
			,
			{
				"name"        : "variable_name",
				"display_name": "Variable Name",
				"type"        : "text",
				"required"	  : true
			},
			{
				"name"        : "variable_type",
				"display_name": "Variable Type",
				"type"        : "option",
				"options"	  :[
					{"name":"Number","value":"NUMBER"},
					{"name":"String","value":"STRING"},
					{"name":"Boolean","value":"BOOLEAN"},
					{"name":"JSON","value":"JSON"},
				],
				"default_value" : "NUMBER",
				"required"	  : true
			},
			{
				"name"         : "refresh_time",
				"display_name" : "Refresh Time",
				"type"         : "text",
				"description"  : "In seconds",
				"default_value": 5
			}
		]),
		newInstance   : function(settings, newInstanceCallback, updateCallback)
		{
			newInstanceCallback(new particleVariableDatasourcePlugin(settings, updateCallback));
		}
	});

	var particleVariableDatasourcePlugin = function(settings, updateCallback)
	{
		var self = this;

		var currentSettings = settings;

		var refreshTimer;

		function getData()
		{
			$.ajax({
					url  : "https://api.particle.io/" + 'v1' + "/devices/" + currentSettings.device_id + "/" + currentSettings.variable_name,
					type : "GET",
					beforeSend: function(xhr)
					{
						try
						{
							xhr.setRequestHeader("Authorization", "Bearer " + particle_token);
						}
						catch(e)
						{
						}
					},
					success   : function(data)
					{
						updateCallback(formatValue(data.result, currentSettings.variable_type));
					},
					error     : function(xhr, status, error)
					{
						//console.log(error);
					}
				});

		}

		function initEventSource(interval)
		{
			interval = interval*1000;
			if(refreshTimer)
			{
				clearInterval(refreshTimer);
			}

			refreshTimer = setInterval(function()
			{
				// Here we call our getData function to update freeboard with new data.
				getData();

			}, interval);
		}

		function destroyEventSource()
		{
			if(refreshTimer)
			{
				clearInterval(refreshTimer);
			}
		}

		self.onSettingsChanged = function(newSettings)
		{
			destroyEventSource();

			currentSettings = newSettings;

			initEventSource(currentSettings.refresh_time);
		}

		self.updateNow = function()
		{
			getData();
		}

		self.onDispose = function()
		{
			destroyEventSource();
		}

		initEventSource(currentSettings.refresh_time);
	}


	// ## Polling Particle Device Info
	freeboard.loadDatasourcePlugin({
		"type_name"   : "particle_device",
		"display_name": "Particle Device Info",
       	"description" : "A datasource for fetching a Particle device's info.",
		"settings"    : _.union(particleApiSettings, [
			{
				"name"         : "refresh_time",
				"display_name" : "Refresh Time",
				"type"         : "text",
				"description"  : "In seconds",
				"default_value": 5
			}
		]),
		newInstance   : function(settings, newInstanceCallback, updateCallback)
		{
			newInstanceCallback(new particlePollingDeviceDatasourcePlugin(settings, updateCallback));
		}
	});

	var particlePollingDeviceDatasourcePlugin = function(settings, updateCallback)
	{
		var self = this;

		var dataObj = {};

		var currentSettings = settings;

		var refreshTimer;

		function getData()
		{
			$.ajax({
					url  : "http://api.particle.io/" + 'v1' + "/devices/" + currentSettings.device_id,
					type : "GET",
					beforeSend: function(xhr)
					{
						try
						{
							xhr.setRequestHeader("Authorization", "Bearer " + particle_token);
						}
						catch(e)
						{
						}
					},
					success   : function(data)
					{
						updateCallback(data);
					},
					error     : function(xhr, status, error)
					{
						//console.log(error);
					}
				});

		}

		function initEventSource(interval)
		{
			interval = interval*1000;
			if(refreshTimer)
			{
				clearInterval(refreshTimer);
			}

			refreshTimer = setInterval(function()
			{
				// Here we call our getData function to update freeboard with new data.
				getData();

			}, interval);

			dataObj["connected"] = false;
			dataObj["name"] = "";
			dataObj["last_heard"] = "";
			dataObj["id"] = "";
			dataObj["last_app"] = null;
			dataObj["variables"] = null;
			dataObj["functions"] = null;
			dataObj["product_id"] = null;
			updateCallback(dataObj);
		}

		function destroyEventSource()
		{
			if(refreshTimer)
			{
				clearInterval(refreshTimer);
			}
		}

		self.onSettingsChanged = function(newSettings)
		{
			destroyEventSource();

			currentSettings = newSettings;

			initEventSource(currentSettings.refresh_time);
		}

		self.updateNow = function()
		{
			getData();
		}

		self.onDispose = function()
		{
			destroyEventSource();
		}

		initEventSource(currentSettings.refresh_time);
	}


	// ## Streaming Particle Device Datasource
	freeboard.loadDatasourcePlugin({
		"type_name"   : "particle_device_stream",
		"display_name": "Particle Device Events",
       	"description" : "A datasource for speaking with Particle Server-Sent Events streams for a single device.",
		"settings"    : _.union(particleApiSettings, [
			{
				"name"        : "events",
				"display_name": "Events",
				"type"        : "array",
				"settings"    : [
					{
						"name"        : "name",
						"display_name": "Event Name/Filter",
						"type"        : "text"
					},
					{
						"name"        : "type",
						"display_name": "Data Type (BOOLEAN, NUMBER, STRING, or JSON)",
						"type"        : "text"
					}
				]
			}
		]),
		newInstance   : function(settings, newInstanceCallback, updateCallback)
		{
			newInstanceCallback(new particleDeviceStreamDatasourcePlugin(settings, updateCallback));
		}
	});

	var particleDeviceStreamDatasourcePlugin = function(settings, updateCallback)
	{
		var self = this;

		var currentSettings = settings;

		var eventSource;

		var dataObj = {};

		var keepAliveTimer;

		function keepAlive(){
			if(eventSource.readyState == EventSource.CLOSED){
				destroyEventSource();
				initEventSource();
			}
			keepAliveTimer = setTimeout(function(){keepAlive();},30000);
		}

		function onMessage(evt)
		{
			if(evt.origin == "https://api.particle.io") 
			{
				var sparkData = JSON.parse(evt.data);
				if(sparkData.coreid == currentSettings.device_id) 
				{
					var evtDef = _.find(currentSettings.events, function(itm){
						return itm.name == evt.type;
					});

					dataObj[evt.type]["data"] = formatValue(sparkData.data, evtDef.type);
					dataObj[evt.type]["published_at"] = formatValue((new Date(sparkData.published_at).getTime() / 1000).toFixed(0), "NUMBER");
					dataObj[evt.type]["ttl"] = formatValue(sparkData.ttl, "NUMBER");
					dataObj[evt.type]["coreid"] = formatValue(sparkData.coreid, "STRING");

					
					updateCallback(dataObj);
				}
			}
		}

		function onOpen(evt)
		{
			//console.log(evt);
		}

		function onError(evt)
		{
			throw new Error("Error connecting to the Particle API.")
		}

		function initEventSource()
		{
			if (!window.EventSource) 
			{
				throw new Error("Browser doesn't support EventSource.")
			} 
			else 
			{
				// Create event source
				eventSource = new EventSource("https://api.particle.io/" + 'v1' + "/devices/" + currentSettings.device_id + "/events?access_token=" + particle_token);

				// Hookup standard event handlers
				eventSource.addEventListener('open', onOpen, false);
				eventSource.addEventListener('error', onError, false);

				// Hookup custom event handlers
				for(var i = 0; i < currentSettings.events.length; i++) 
				{
					// Add event handler
					eventSource.addEventListener(currentSettings.events[i].name, onMessage, false);

					// Add data property
					dataObj[currentSettings.events[i].name] = {};
					dataObj[currentSettings.events[i].name]["data"] = formatValue("", currentSettings.events[i].type);
					dataObj[currentSettings.events[i].name]["published_at"] = formatValue(0, "NUMBER");
					dataObj[currentSettings.events[i].name]["ttl"] = formatValue(0, "NUMBER");
					dataObj[currentSettings.events[i].name]["coreid"] = formatValue("", "STRING");
				}

				// Broadcast an initial update
				keepAlive();
				updateCallback(dataObj);
			}
		}

		function destroyEventSource()
		{
			clearInterval(keepAliveTimer);
			// Close connection
			if(eventSource.readyState == EventSource.OPEN) {
				eventSource.close();
			}

			// Remove custom event handlers
			for(var i = 0; i < currentSettings.events.length; i++)
			{
				// Remove handler
				eventSource.removeEventListener(currentSettings.events[i].name, onMessage, false);

				// Remove property from data object
				delete dataObj[currentSettings.events[i].name];
			}

			// Remove standard event handlers
			eventSource.removeEventListener('open', onOpen, false);
			eventSource.removeEventListener('error', onError, false);
		}

		self.onSettingsChanged = function(newSettings)
		{
			destroyEventSource();

			currentSettings = newSettings;

			initEventSource();
		}

		self.updateNow = function()
		{
			// Event source streams as it happens, so no need for this
		}

		self.onDispose = function()
		{
			destroyEventSource();
		}

		initEventSource();
	}

	// ## Streaming Particle Events Datasource
	freeboard.loadDatasourcePlugin({
		"type_name"   : "particle_event_stream",
		"display_name": "Particle Events",
       	"description" : "A datasource for speaking with Particle Server-Sent Events streams.",
		"settings"    : [
			{
				"name"        : "stream_type",
				"display_name": "Event Stream Type",
				"type"        : "option",
				"options"	  :[
					{"name":"Your Devices","value":"user"},
					{"name":"All Public Events","value":"public"},
				],
				"default_value" : "user",
				"required"	  : true
			},
			{
				"name"        : "events",
				"display_name": "Events",
				"type"        : "array",
				"settings"    : [
					{
						"name"        : "name",
						"display_name": "Event Name/Filter",
						"type"        : "text"
					},
					{
						"name"        : "type",
						"display_name": "Data Type (BOOLEAN, NUMBER, STRING, or JSON)",
						"type"        : "text"
					}
				]
			}]
		,
		newInstance   : function(settings, newInstanceCallback, updateCallback)
		{
			newInstanceCallback(new particleStreamDatasourcePlugin(settings, updateCallback));
		}
	});

	var particleStreamDatasourcePlugin = function(settings, updateCallback)
	{
		var self = this;

		var currentSettings = settings;

		var eventSource;

		var dataObj = {};

		var keepAliveTimer;

		function keepAlive(){
			if(eventSource.readyState == EventSource.CLOSED){
				destroyEventSource();
				initEventSource();
			}
			keepAliveTimer = setTimeout(function(){keepAlive();},30000);
		}

		function onMessage(evt)
		{
			if(evt.origin == "https://api.particle.io") 
			{
				var sparkData = JSON.parse(evt.data);

				var evtDef = _.find(currentSettings.events, function(itm){
					return itm.name == evt.type;
				});

				dataObj[evt.type]["data"] = formatValue(sparkData.data, evtDef.type);
				dataObj[evt.type]["published_at"] = formatValue((new Date(sparkData.published_at).getTime() / 1000).toFixed(0), "NUMBER");
				dataObj[evt.type]["ttl"] = formatValue(sparkData.ttl, "NUMBER");
				dataObj[evt.type]["coreid"] = formatValue(sparkData.coreid, "STRING");
				
				updateCallback(dataObj);
			
			}
		}

		function onOpen(evt)
		{
			//console.log(evt);
		}

		function onError(evt)
		{
			clearInterval(keepAliveTimer);
			throw new Error("Error connecting to the Particle API.");
		}

		function initEventSource()
		{
			if (!window.EventSource) 
			{
				throw new Error("Browser doesn't support EventSource.")
			} 
			else 
			{
				// Create event source
				if(currentSettings.device_id == "user")
					eventSource = new EventSource("https://api.particle.io/" + 'v1' + "/devices/events?access_token=" + particle_token);
				else
					eventSource = new EventSource("https://api.particle.io/" + 'v1' + "/events?access_token=" + particle_token);
				// Hookup standard event handlers
				eventSource.addEventListener('open', onOpen, false);
				eventSource.addEventListener('error', onError, false);

				// Hookup custom event handlers
				for(var i = 0; i < currentSettings.events.length; i++) 
				{
					// Add event handler
					eventSource.addEventListener(currentSettings.events[i].name, onMessage, false);

					// Add data property
					dataObj[currentSettings.events[i].name] = {};
					dataObj[currentSettings.events[i].name]["data"] = formatValue("", currentSettings.events[i].type);
					dataObj[currentSettings.events[i].name]["published_at"] = formatValue(0, "NUMBER");
					dataObj[currentSettings.events[i].name]["ttl"] = formatValue(0, "NUMBER");
					dataObj[currentSettings.events[i].name]["coreid"] = formatValue("", "STRING");
				}

				// Broadcast an initial update
				keepAlive();
				updateCallback(dataObj);
			}
		}

		function destroyEventSource()
		{
			// Close connection
			clearInterval(keepAliveTimer);
			if(eventSource.readyState == EventSource.OPEN) {
				eventSource.close();
			}

			// Remove custom event handlers
			for(var i = 0; i < currentSettings.events.length; i++)
			{
				// Remove handler
				eventSource.removeEventListener(currentSettings.events[i].name, onMessage, false);

				// Remove property from data object
				delete dataObj[currentSettings.events[i].name];
			}

			// Remove standard event handlers
			eventSource.removeEventListener('open', onOpen, false);
			eventSource.removeEventListener('error', onError, false);
		}

		self.onSettingsChanged = function(newSettings)
		{
			destroyEventSource();

			currentSettings = newSettings;

			initEventSource();
		}

		self.updateNow = function()
		{
			// Event source streams as it happens, so no need for this
		}

		self.onDispose = function()
		{
			destroyEventSource();
		}

		initEventSource();
	}

	// ## Basic Button Widget
	/*freeboard.loadWidgetPlugin({
		"type_name"   : "mb_buttons_button",
		"display_name": "Button",
		"settings"    : [
            {
                "name": "text",
                "display_name": "Text",
                "type": "calculated"
            },
            {
                "name": "color",
                "display_name": "Color",
                "type": "calculated",
                "description": "<br /><br /><hr />"
            },
            {
                "name": "url",
                "display_name": "URL",
                "description": "The URL to notify when the button is toggled.",
                "type": "calculated"
            },
            {
                "name": "method",
                "display_name": "Method",
                "type": "option",
                "options" : [
					{
						name: "GET",
						value: "GET"
					},
					{
						name: "POST",
						value: "POST"
					},
					{
						name: "PUT",
						value: "PUT"
					},
					{
						name: "DELETE",
						value: "DELETE"
					}
                ]
            },
            {
                "name": "body",
                "display_name": "Body",
                "description": "The body of the request. Normally only used if method is POST",
                "type": "calculated"
            },
            {
                "name": "headers",
                "display_name": "Headers",
                "type": "array",
                "settings" : [
					{
						name        : "name",
						display_name: "Name",
						type        : "text"
					},
					{
						name        : "value",
						display_name: "Value",
						type        : "text"
					}
				]
            },
		],
		newInstance   : function(settings, newInstanceCallback)
		{
			newInstanceCallback(new buttonWidget(settings));
		}
	});*/

	var buttonWidget = function(settings)
	{
		var self = this;
		var currentSettings = settings;
		var url, body;

		var buttonElement = $('<a href="#" class="button-widget-button"></a>')
			.on("click", function(e){

				e.preventDefault();

				var payload = body;

				// Can the body be converted to JSON?
				if(payload)
				{
					try
					{
						payload = JSON.parse(payload);
					}
					catch(e)
					{

					}
				}
				console.log(payload);
				$.ajax({
					url  : url,
					//dataType  : (errorStage == 1) ? "JSONP" : "JSON",
					type : currentSettings.method || "GET",
					data : payload,
					beforeSend: function(xhr)
					{
						try
						{
							_.each(currentSettings.headers, function(header)
							{
								var name = header.name;
								var value = header.value;

								if(!_.isUndefined(name) && !_.isUndefined(value))
								{
									xhr.setRequestHeader(name, value);
								}
							});
						}
						catch(e)
						{
						}
					},
					success   : function(data)
					{
						//console.log("Success!");
					},
					error     : function(xhr, status, error)
					{
						//console.log(error);
					}
				});

			});

		self.render = function(containerElement)
		{
			$(containerElement).append(buttonElement);
		}

		self.getHeight = function()
		{
			return 1;
		}

		self.onSettingsChanged = function(newSettings)
		{
			// Store settings
			currentSettings = newSettings;
		}

		self.onCalculatedValueChanged = function(settingName, newValue)
		{
			switch(settingName){
				case "text":
					$(buttonElement).html(newValue);
					break;
				case "color":
					$(buttonElement).css("backgroundColor", newValue);
					break;
				case "url":
					url = newValue;
					break;
				case "body":
					body = newValue;
					break;
			}
		}

		self.onDispose = function()
		{
			$(buttonElement).off("click");
		}
	}

	// ## Particle Function Button Widget
	freeboard.loadWidgetPlugin({
		"type_name"   : "mb_buttons_particlefunction",
		"display_name": "Particle Function Button",
		"settings"    : _.union([
            {
                "name": "text",
                "display_name": "Button Label",
                "type": "calculated",
				"required"	  : true
            },
            {
                "name": "color",
                "display_name": "Color",
                "type": "calculated",
                "description": "Javascript valid color name, hex code, or rgb."
            }
        ],
        particleApiSettings,
        [
			{
				"name"        : "function_name",
				"display_name": "Function Name",
				"type"        : "text",
				"required"	  : true
			},
			{
				"name"        : "function_args",
				"display_name": "Function Arguments",
				"type"        : "calculated",
				"required"	  : false
			},
		]),
		newInstance   : function(settings, newInstanceCallback)
		{
			newInstanceCallback(new particleFunctionButtonWidget(settings));
		}
	});

	var particleFunctionButtonWidget = function(settings)
	{
		var self = this;

		var convertToButtonSettings = function(settings)
		{
			var newSettings = $.extend({}, settings);
			newSettings.method = "POST";
			newSettings.headers = [ { "name" : "Authorization", "value" : "Bearer " + particle_token }];
			return newSettings;
		}

		var btn = new buttonWidget(convertToButtonSettings(settings));
		btn.onCalculatedValueChanged("url", "https://api.particle.io/" + 'v1' + "/devices/" + settings.device_id + "/" + settings.function_name);

		self.render = function(containerElement)
		{
			btn.render(containerElement);
		}

		self.getHeight = function()
		{
			return btn.getHeight();
		}

		self.onSettingsChanged = function(newSettings)
		{
			btn.onSettingsChanged(convertToButtonSettings(newSettings));
		}

		self.onCalculatedValueChanged = function(settingName, newValue)
		{
			switch(settingName){
				case "function_args":
					btn.onCalculatedValueChanged("body", "args="+ newValue);
					break;
				default:
					btn.onCalculatedValueChanged(settingName, newValue);
					break
			}
		}

		self.onDispose = function()
		{
			btn.onDispose();
		}
	}


	// ## Particle Function Button Widget
	freeboard.loadWidgetPlugin({
		"type_name"   : "mb_buttons_particleevent",
		"display_name": "Particle Event Button",
		"settings"    : _.union([
            {
                "name": "text",
                "display_name": "Button Label",
                "type": "calculated",
				"required"	  : true
            },
            {
                "name": "color",
                "display_name": "Color",
                "type": "calculated",
                "description": "Javascript valid color name, hex code, or rgb."
            }
        ],
        [
			{
				"name"        : "event_name",
				"display_name": "Event Name",
				"type"        : "text",
				"required"	  : true
			},
			{
				"name"        : "event_data",
				"display_name": "Event Data",
				"type"        : "text",
				"required"	  : false
			},
			{
				"name"        : "event_public",
				"display_name": "Public Event",
				"type"        : "boolean",
				"default"	  : false
			},
		]),
		newInstance   : function(settings, newInstanceCallback)
		{
			newInstanceCallback(new particleEventButtonWidget(settings));
		}
	});

	var particleEventButtonWidget = function(settings)
	{
		var self = this;

		var convertToButtonSettings = function(settings)
		{
			var newSettings = $.extend({}, settings);
			newSettings.method = "POST";
			
			newSettings.headers = [ { "name" : "Authorization", "value" : "Bearer " + particle_token }];
			return newSettings;
		}

		var btn = new buttonWidget(convertToButtonSettings(settings));
		btn.onCalculatedValueChanged("url", "https://api.particle.io/v1/devices/events");
		if(settings.event_public){
				var sPrivate = "false";
			}
			else{
				var isPrivate = "true";
			}
		btn.onCalculatedValueChanged("body", JSON.stringify({"name":settings.event_name,"data":settings.event_data,"private":isPrivate,"ttl":60}));

		self.render = function(containerElement)
		{
			btn.render(containerElement);
		}

		self.getHeight = function()
		{
			return btn.getHeight();
		}

		self.onSettingsChanged = function(newSettings)
		{
			btn.onSettingsChanged(convertToButtonSettings(newSettings));
			if(newSettings.event_public){
				var sPrivate = "false";
			}
			else{
				var isPrivate = "true";
			}
			btn.onCalculatedValueChanged("body", JSON.stringify({"name":newSettings.event_name,"data":newSettings.event_data,"private":isPrivate,"ttl":60}));
		}

		self.onCalculatedValueChanged = function(settingName, newValue)
		{
			switch(settingName){
				default:
					btn.onCalculatedValueChanged(settingName, newValue);
					break
			}
		}

		self.onDispose = function()
		{
			btn.onDispose();
		}
	}

}());