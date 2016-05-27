/*****************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Erik Tylek Kettenburg
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 *****************************************************************************/
(function() {
    var EpochRealtimeWidgetPlugin = function (settings) {
        var self = this;
        var currentSettings = settings;
        var myChart;
        var myContainer;
        var myChartWrapper= $('<div class="epoch-theme-dark"></div>');
        var myChartElement = $('<div  class="epoch"></div>');
        var lastChartWidth = 0;
        var resizeInterval;
        var updateInterval;
        var currentData = {};
        var dataLastUpdateStamp = 0;
        var rateLimitTimer = null;


        self.render = function(container) {
            myContainer = container;
            myChartWrapper.append(myChartElement.height(currentSettings.height*2*60-10))
            $(container).append(myChartWrapper);

            var chartData = [];
            currentData = {};

            if(currentSettings.data0 !== undefined){
                currentData['data0'] = 0;
                chartData.push({label:"Data Series 1",values: []});
            }
            if(currentSettings.data1 !== undefined){
                currentData['data1'] = 0;
                chartData.push({label:"Data Series 2",values: []});
            }
            if(currentSettings.data2 !== undefined){
                currentData['data2'] = 0;
                chartData.push({label:"Data Series 3",values: []});
            }
            if(currentSettings.data3 !== undefined){
                currentData['data3'] = 0;
                chartData.push({label:"Data Series 4",values: []});
            }
            if(currentSettings.data4 !== undefined){
                currentData['data4'] = 0;
                chartData.push({label:"Data Series 5",values: []});
            }

            //console.log(chartData);
            //console.log(currentSettings);

            myChart = myChartElement.epoch({ type: currentSettings.plot_type,  margins: {left: 40}, axes: ['bottom', 'left'], data: chartData });
            myChartElement.find('canvas').css('z-index',0);
            //lastChartWidth = myChartWrapper.width();

            resizeInterval = setInterval(function(){

                if(myChartWrapper.width()!=lastChartWidth){
                    //console.log(myChartWrapper.height());
                    lastChartWidth = myChartWrapper.width();
                    myChart.option('width', myChartWrapper.width());
                    myChart.option('height', myChartWrapper.height());
                }
            },1000);
            if(currentSettings.series_option == 3){
                updateInterval = setInterval(function(){
                    var ts = (Math.floor(Date.now() / 1000));
                    self.pushCurrentData(ts);
                },currentSettings.update_interval*1000);
            }
        };

        self.getHeight = function() {
            return currentSettings.height*2;
        };

        self.onSettingsChanged = function(newSettings) {
            var rebuild = 0;
            if(currentSettings.data1 !== newSettings.data1 || currentSettings.data2 !== newSettings.data2 || currentSettings.data3 !== newSettings.data3 || currentSettings.data4 !== newSettings.data4)
            {
                rebuild = 1;
            }
            if(currentSettings.plot_type != newSettings.plot_type){
                rebuild = 1;
            }


            if(!rebuild){
                if(currentSettings.height != newSettings.height){
                    myChartElement.height(currentSettings.height*2*60-10);
                }
                if(currentSettings.update_interval !== newSettings.update_interval || (newSettings.series_option!=currentSettings.series_option && newSettings.series_option == 3)){
                    clearInterval(updateInterval);
                    updateInterval = setInterval(function(){
                        var ts = (Math.floor(Date.now() / 1000));
                        self.pushCurrentData(ts);
                    },newSettings.update_interval*1000);
                }
                else if(newSettings.series_option!=currentSettings.series_option && newSettings.series_option != 3){
                    clearInterval(updateInterval);
                    dataLastUpdateStamp = 0;
                    clearTimeout(rateLimitTimer);
                    rateLimitTimer = null;
                }
            }

            currentSettings = newSettings;

            if(rebuild){
                self.dispose();
                self.render(myContainer);
                return;
            }
        };

        self.pushCurrentData = function(timestemap){
            var dataArray = [];
            dataArray.push({time:timestemap,y:currentData['data0']});
            if(currentSettings.data1 !== undefined)
                dataArray.push({time:timestemap,y:currentData['data1']});
            if(currentSettings.data2 !== undefined)
                dataArray.push({time:timestemap,y:currentData['data2']});
            if(currentSettings.data3 !== undefined)
                dataArray.push({time:timestemap,y:currentData['data3']});
            if(currentSettings.data4 !== undefined)
                dataArray.push({time:timestemap,y:currentData['data4']});
            myChart.push(dataArray);
        }

        self.onCalculatedValueChanged = function(settingName, newValue) {
            if ((settingName == "changeInterval" || settingName == "data0" || settingName == "data1" || settingName == "data2" || settingName == "data3" || settingName == "data4") && currentSettings.data1 !== undefined) {


                if(currentSettings.series_option == 1){
                    var tsm = Date.now();
                    if(settingName != "changeInterval")
                        currentData[settingName] = newValue;

                    if(dataLastUpdateStamp == Math.floor(tsm/1000)){
                        if(rateLimitTimer == null) //if not set, set timer, otherwise exit
                            rateLimitTimer = setTimeout(function(){ self.onCalculatedValueChanged("changeInterval","");},(Math.ceil(tsm/1000)*1000)-tsm);
                    }
                    else{
                        clearTimeout(rateLimitTimer);
                        rateLimitTimer = null;
                        var ts = Math.floor(tsm/1000);
                       dataLastUpdateStamp = ts; 
                       self.pushCurrentData(ts);
                    }
                    
                    
                    /*if(newValue.toString().length>maxChartValueLength){
                        
                        maxChartValueLength = newValue.toString().length;
                        var leftMargin = 20 + (4*maxChartValueLength);
                        console.log(newValue);
                        console.log(maxChartValueLength);
                        console.log(leftMargin);
                        myChart.option( 'margins', {left: leftMargin});

                    }*/
                    
                }
                else if(currentSettings.series_option == 2){
                    if(dataLastUpdateStamp == 0){
                        dataLastUpdateStamp = (Math.floor(Date.now() / 1000));
                    }
                    currentData[settingName] = newValue;



                    var pushData = 1;

                    if(currentSettings.data1 != "" && currentData['data1'] === undefined)
                        pushData = 0;
                    if(currentSettings.data2 != "" && currentData['data2'] === undefined)
                        pushData = 0;
                    if(currentSettings.data3 != "" && currentData['data3'] === undefined)
                        pushData = 0;
                    if(currentSettings.data4 != "" && currentData['data4'] === undefined)
                        pushData = 0;


                    if(pushData){
                        self.pushCurrentData(dataLastUpdateStamp);
                        dataLastUpdateStamp = 0;
                        currentData = {};
                    }
                }
                if(currentSettings.series_option == 3){
                    currentData[settingName] = newValue;
                }


            }
            else if (settingName == "data0"){
                var ts = (Math.floor(Date.now() / 1000));
                myChart.push([{time:ts,y:newValue}]);

            }
        };



        self.dispose = function() {
            clearInterval(updateInterval);
            clearInterval(resizeInterval);
            clearTimeout(rateLimitTimer);
            rateLimitTimer = null;
            myChart = undefined;
            myChartWrapper.empty();
            $(myContainer).empty();
            myChartWrapper= $('<div class="epoch-theme-dark"></div>');
            myChartElement = $('<div class="epoch"></div>');
        };

        self.onDispose = function() {
            self.dispose();
            myContainer = null;
        };
    };
/*
    freeboard.loadWidgetPlugin({
        type_name:          "epoch_plugin",
        display_name:       "Time Series Graphs",
        description:        "Time Series graphs for event or polled data, using EpochJS",
        external_scripts:   [
                                "https://epochjs.github.io/epoch/js/d3.js",
                                "https://cdn.jsdelivr.net/epoch/0.8.4/epoch.min.js"
                            ],
        settings:           [
                                {
                                    name:           "plot_type",
                                    display_name:   "Plot Type",
                                    type:           "option",
                                    options: [
                                                    { name: 'Line', value: 'time.line' },
                                                    { name: 'Bar', value: 'time.bar' },
                                                    { name: 'Area', value: 'time.area' }
                                    ]
                                },
                                {
                                    name:           "height",
                                    display_name:   "Height",
                                    type:           "option",
                                    options: [
                                                    { name: 'Normal', value: 1 },
                                                    { name: 'Large', value: 2 },
                                                    { name: 'Huge', value: 3 }
                                    ],
                                    default_value:  1
                                },
                                {
                                    "name"        : "data0",
                                    "display_name": "Series 1 Data",
                                    "type"        : "calculated",
                                    "required": true
                                },
                                {
                                    "name"        : "data1",
                                    "display_name": "Series 2 Data",
                                    "type"        : "calculated",
                                    "description":    "(optional)",
                                    "required": false
                                },
                                {
                                    "name"        : "data2",
                                    "display_name": "Series 3 Data",
                                    "type"        : "calculated",
                                    "description":    "(optional)",
                                    "required": false
                                },
                                {
                                    "name"        : "data3",
                                    "display_name": "Series 4 Data",
                                    "type"        : "calculated",
                                    "description":    "(optional)",
                                    "required": false
                                },
                                {
                                    "name"        : "data4",
                                    "display_name": "Series 5 Data",
                                    "type"        : "calculated",
                                    "description":    "(optional)",
                                    "required": false
                                },
                                {
                                    name:           "series_option",
                                    display_name:   "Plot Series Data",
                                    description:    "(only applies when more than one series is in use)",
                                    type:           "option",
                                    options: [
                                                    { name: 'One time point per individual update (max one per second)', value: 1 },
                                                    { name: 'One time point per complete set of updates', value: 2 },
                                                    { name: 'One time point per fixed interval', value: 3 },
                                    ],
                                    default_value:  1
                                },
                                {
                                    "name"        : "update_interval",
                                    "display_name": "Fixed update interval",
                                    "type"        : "text",
                                    "description":    "(in seconds - only applies if the third option is selected above)",
                                    default_value:  1
                                },
                               
                            ],

        newInstance:        function(settings, newInstanceCB) {
                                newInstanceCB(new EpochRealtimeWidgetPlugin(settings));
                            }
    });




        var EpochPieWidgetPlugin = function (settings) {
        var self = this;
        var currentSettings = settings;
        var myChart;
        var myContainer;
        var myChartWrapper= $('<div class="epoch-theme-dark"></div>');
        var myChartElement = $('<div  class="epoch"></div>');
        var lastChartWidth = 0;
        var resizeInterval;
        var currentData = {};


        self.render = function(container) {
            myContainer = container;
            myChartWrapper.append(myChartElement.height(currentSettings.height*2*60-10))
            myChartWrapper.append(myChartElement.height(currentSettings.height*2*60-10))
            $(container).append(myChartWrapper);

            var chartData = [];
            currentData = {};

            if(currentSettings.data0 !== undefined){
                currentData['data0'] = 0;
                chartData.push({label:currentSettings.label0,value: 0});
            }
            if(currentSettings.data1 !== undefined){
                currentData['data1'] = 0;
                chartData.push({label:currentSettings.label1,value: 0});
            }
            if(currentSettings.data2 !== undefined){
                currentData['data2'] = 0;
                chartData.push({label:currentSettings.label2,value: 0});
            }
            if(currentSettings.data3 !== undefined){
                currentData['data3'] = 0;
                chartData.push({label:currentSettings.label3,value: 0});
            }
            if(currentSettings.data4 !== undefined){
                currentData['data4'] = 0;
                chartData.push({label:currentSettings.label4 ,value: 0});
            }


            myChart = myChartElement.epoch({ type: 'pie',  data: chartData });
            myChartElement.find('canvas').css('z-index',0);
            //lastChartWidth = myChartWrapper.width();

            resizeInterval = setInterval(function(){

                if(myChartWrapper.width()!=lastChartWidth){
                    //console.log(myChartWrapper.height());
                    lastChartWidth = myChartWrapper.width();
                    myChart.option('width', myChartWrapper.width());
                    myChart.option('height', myChartWrapper.height());
                }
            },1000);

        };

        self.getHeight = function() {
            return currentSettings.height*2;
        };

        self.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;

            self.dispose();
            self.render(myContainer);
            
        };

        self.pushCurrentData = function(timestemap){
            var chartData = [];

            if(currentSettings.data0 !== undefined){
                chartData.push({label:currentSettings.label0,value: currentData['data0']});
            }
            if(currentSettings.data1 !== undefined){
                chartData.push({label:currentSettings.label1,value: currentData['data1']});
            }
            if(currentSettings.data2 !== undefined){
                chartData.push({label:currentSettings.label2,value: currentData['data2']});
            }
            if(currentSettings.data3 !== undefined){
                chartData.push({label:currentSettings.label3,value: currentData['data3']});
            }
            if(currentSettings.data4 !== undefined){
                chartData.push({label:currentSettings.label4 ,value: currentData['data4']});
            }

            myChart.update(chartData);
        };

        self.onCalculatedValueChanged = function(settingName, newValue) {
            currentData[settingName] = newValue;
            self.pushCurrentData();
        };



        self.dispose = function() {
            clearInterval(resizeInterval);
            myChart = undefined;
            myChartWrapper.empty();
            $(myContainer).empty();
            myChartWrapper= $('<div class="epoch-theme-dark"></div>');
            myChartElement = $('<div class="epoch"></div>');
        };

        self.onDispose = function() {
            self.dispose();
            myContainer = null;
        };
    };

    freeboard.loadWidgetPlugin({
        type_name:          "epoch_pie_plugin",
        display_name:       "Pie Chart",
        description:        "Pie Chart for event or polled data, using EpochJS",
        external_scripts:   [
                                "https://epochjs.github.io/epoch/js/d3.js",
                                "https://cdn.jsdelivr.net/epoch/0.8.4/epoch.min.js"
                            ],
        settings:           [
                                {
                                    name:           "height",
                                    display_name:   "Size",
                                    type:           "option",
                                    options: [
                                                    { name: 'Normal', value: 1 },
                                                    { name: 'Large', value: 2 },
                                                    { name: 'Huge', value: 3 }
                                    ],
                                    default_value:  1
                                },
                                {
                                    "name"        : "label0",
                                    "display_name": "Series 1 Label",
                                    "type"        : "text",
                                    "required": true
                                },
                                {
                                    "name"        : "data0",
                                    "display_name": "Series 1 Data",
                                    "type"        : "calculated",
                                    "required": true
                                },
                                {
                                    "name"        : "label1",
                                    "display_name": "Series 2 Label",
                                    "type"        : "text",
                                    "required": false
                                },
                                {
                                    "name"        : "data1",
                                    "display_name": "Series 2 Data",
                                    "type"        : "calculated",
                                    "description":    "(optional)",
                                    "required": false
                                },
                                {
                                    "name"        : "label2",
                                    "display_name": "Series 3 Label",
                                    "type"        : "text",
                                    "required": false
                                },
                                {
                                    "name"        : "data2",
                                    "display_name": "Series 3 Data",
                                    "type"        : "calculated",
                                    "description":    "(optional)",
                                    "required": false
                                },
                                {
                                    "name"        : "label3",
                                    "display_name": "Series 4 Label",
                                    "type"        : "text",
                                    "required": false
                                },
                                {
                                    "name"        : "data3",
                                    "display_name": "Series 4 Data",
                                    "type"        : "calculated",
                                    "description":    "(optional)",
                                    "required": false
                                },
                                {
                                    "name"        : "label4",
                                    "display_name": "Series 5 Label",
                                    "type"        : "text",
                                    "required": false
                                },
                                {
                                    "name"        : "data4",
                                    "display_name": "Series 5 Data",
                                    "type"        : "calculated",
                                    "description":    "(optional)",
                                    "required": false
                                }
                               
                            ],

        newInstance:        function(settings, newInstanceCB) {
                                newInstanceCB(new EpochPieWidgetPlugin(settings));
                            }
    });
*/
}());
