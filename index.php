<!DOCTYPE html>
<?php

if(empty($_GET['id'])){
    //assign a new id
    $newid  = bin2hex(openssl_random_pseudo_bytes(20));
    header('Location: https://digistump.com/dashboard/?id='.$newid);
    exit();
}
if(strlen($_GET['id'])!=40){
    //assign a new id
    $newid  = bin2hex(openssl_random_pseudo_bytes(20));
    header('Location: https://digistump.com/dashboard/?id='.$newid);
    exit();
}

?>
<html>
<head>
    <meta charset="UTF-8">
    <title>Digistump Dashboard (for Particle Devices)</title>
	<meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <meta name="viewport" content = "width = device-width, initial-scale = 1, user-scalable = no" />
    <link href="css/freeboard.min.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/epoch/0.8.4/epoch.min.css" rel="stylesheet" />
    <style>
    .noblue:focus.noblue:active,.noblue:hover,.noblue a:focus.noblue a:active,.noblue a:hover{
        color:#B88F51 !important;
    }
    </style>
    <script src="js/freeboard.thirdparty.min.js"></script>
    <script src="https://cdn.jsdelivr.net/particle-api-js/5/particle.min.js"></script>
    <script type="text/javascript">
    var particle_devices = [];
    var particle_token = "";
    var dashboard_id = "<?=$_GET['id']?>";


    var saveToServer;
    var bookmarkme = function () {
      var url = 'https://digistump.com/dashboard/?id=' + dashboard_id; 
      var name = "Digistump Dashboard (for Particle Devices)";

      if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1){ //chrome
        alert("Press " 
            + (navigator.userAgent.toLowerCase().indexOf('mac') != -1 ? 
                'Command/Cmd' : 'CTRL') + "+D to bookmark.")
      } 
      else if (window.sidebar) { // Mozilla Firefox Bookmark
        //important for firefox to add bookmarks - remember to check out the checkbox on the popup
        $(this).attr('rel', 'sidebar');
        //set the appropriate attributes
        $(this).attr('href', url);
        $(this).attr('title', name);

        //add bookmark:
        //  window.sidebar.addPanel(name, url, '');
        //  window.sidebar.addPanel(url, name, '');
        window.sidebar.addPanel('', '', '');
      } 
      else if (window.external) { // IE Favorite
            window.external.addFavorite(url, name);
      } 
      return false;
    };
$(function()
{ //DOM Ready

    
    var particle = new Particle();
    $('#login_form').submit(function(e){
        e.preventDefault();
        $('#login_button').attr('disabled','disabled');
        $('#login_register').attr('disabled','disabled');
        particle.login({username: $('#login_email').val(), password: $('#login_password').val()}).then(
            
            function(data) {
                $('#login_button').attr('disabled',false);
                $('#login_register').attr('disabled',false);
                $('#login_password').val("");
                particle_token = data.body.access_token;

                particle.listDevices({ auth: particle_token }).then(
                    
                    function(devices){
                        //console.log(devices);
                        $('#login_error').hide();
                        $('#devices_error').hide();
                        $('#login_email').val("");
                        $('#login_box').hide();
                        $.each(devices.body,function(key,device){
                            var deviceName = 'Unnamed ('+device.id+')';
                            if(device.name != null){
                                deviceName = device.name+' ('+device.id+')';
                            }
                            particle_devices.push({"name":deviceName,"value":device.id});
                        });
                    
                        head.js("js/freeboard_plugins.js",
                            "plugins/epoch.js",
                            "plugins/particle.js",
                            "plugins/widget.ragIndicator.js",
                                // *** Load more plugins here ***
                                function(){

                                    
                                    
                                        //console.log(particle_devices);
                                        freeboard.initialize(true);

                                        saveToServer = function(){
                                            $.post('https://digistump.com/dashboard/save.php?id='+dashboard_id,{'data':JSON.stringify(freeboard.serialize())},function(){
                                                var contentElement = $('<p>Your dashboard has been saved to the server. To access it bookmark this page or use the following link: <a href="https://digistump.com/dashboard/?id='+dashboard_id+'">https://digistump.com/dashboard/?id='+dashboard_id+'</a></p>');
                                                freeboard.showDialog(contentElement, "Saved to Server", "OK");
                                            });
                                        };

                                        $.getJSON('https://s3.amazonaws.com/digistump-dashboard/'+dashboard_id, function(data) {
                                            freeboard.loadDashboard(data, function() {
                                                freeboard.setEditing(true);
                                            });
                                        });


                                        var hashpattern = window.location.hash.match(/(&|#|\?)source=([^&]+)/);
                                        if (hashpattern !== null) {
                                            $.getJSON(hashpattern[2], function(data) {
                                                freeboard.loadDashboard(data, function() {
                                                    freeboard.setEditing(false);
                                                });
                                            });
                                        }

                                    
                        });
                    },
                    function(err){
                        $('#devices_error').show();

                    }
                );
            },
            function(err) {
                $('#login_button').attr('disabled',false);
                $('#login_register').attr('disabled',false);
                $('#login_password').val("");
                $('#login_error').show();
            }
        );
    });
});
    </script>
</head>
<body>
<div id="login_box" style="padding-top:10px;text-align:center;">
<h1>Digistump Dashboard</h1>
<form id="login_form">
    <div id="devices_error" style="color:red;font-weight:bold;display:none;">No devices found.</div>
    <div id="login_error" style="color:red;font-weight:bold;display:none;">Invalid email or password.</div>
    <input id="login_email" type="text" placeholder="Particle Login Email"><br>
    <input id="login_password" type="password" placeholder="Particle Password">
    <div style="padding-top:10px;text-align:center;">
        <!--<button class="pure-button pure-button-primary" id="login_back">Back</button> &nbsp; -->
        <input type="submit" value="Login">
    </div>
</form>
<div style="text-align:left; width:50%; margin:auto;">
<h2>How to use the Digistump Dashboard with your Particle Devices:</h2>

<h3>Saving your dashboard:</h3>

<p><b>Save your dashboard to the server:</b> Click the "Save Dashboard to Server" link in the upper left to save your dashboard to the server. Your dashboard will be saved to the server and loaded whenever you visit the unique link for that dashboard. You can see that link in the address bar, when saving, or here: <a href="https://digistump.com/dashboard/?id=<?=$_GET['id']?>">https://digistump.com/dashboard/?id=<?=$_GET['id']?></a>. Do not share your unique URL with anyone who you don't want to see your dashboard setup. You still must login to the same Particle account when accessing a dashboard, for the Particle datasources to work (and for your security - your browser connects directly to Particle's servers).</p>
<p><b>Save your dashboard to a file:</b> Click the "Save Dashoard to File" link in the upper left to download a file of your dashboard. This file can then be loaded using the "Load Dashboard from File" link. NOTE: You must login to the same Particle account when loading a file, for the Particle datasources to work.</p>
<p><b>To make a new dashboard:</b> If you have saved a dashboard to the server and want to make another one, just go to <a href="https://digistump.com/dashboard/">https://digistump.com/dashboard/</a> and you will be redirected to a new unique URL for a new dashboard.</p>
<p><b>If you do not save your dashboard after making changes, those changes will be lost if you leave or reload the page!</b></p>

<h3>Adding to your dashboard:</h3>

<p><b>Add a datasource</b> - click that "Add Datasource" link in the upper right, select a Datasource type and enter the details.</p>
<p><b>Add a pane to the dashboard</b> - click the "Add Pane" link at the bottom of the list in the upper left.</p>
<p><b>Add a widget</b> - place the cursor on the newly created pane, click the plus button to add a widget. Select a widget and specify the datasource you created previously.</p>
<p><b>Repeat for additional widgets and datasources.</b></p>
<br><br><br>
The Digistump Dashboard uses <a href="https://github.com/Freeboard/freeboard">Freeboard.io</a>, the Particle datasources are based on code originally from <a href="https://community.particle.io/t/cool-looking-dashboard-for-connected-devices/4021/27">@krvarma</a> on the Particle forums. The plugin source code for our extended Particle datasources can be found on <a href="https://github.com/digistump/OakDashboard">Github</a>.
</div>
</div>
<div id="board-content">
    <img id="dash-logo" data-bind="attr:{src: header_image}, visible:header_image()">
    <div class="gridster responsive-column-width">
        <ul data-bind="grid: true">
        </ul>
    </div>
</div>
<header id="main-header" data-bind="if:allow_edit">
    <div id="admin-bar">
        <div id="admin-menu" style="top:15px;">
            <div id="board-tools">
                <h1 id="board-logo" class="title bordered" style="font-size:18px;font-weight:normal;margin-bottom:0px;line-height:20px;padding-right:40px;padding-left:40px;border: solid 1px #d3d4d4;">Digistump Dashboard</h1>
                <div id="board-actions">
                    <ul class="board-toolbar vertical">
                        <li class="noblue"><a href="#" onclick="saveToServer(); return false;"><i class="icon-download-alt icon-white"></i>
                            <label class="noblue">Save Dashboard to Server</label></a>
                        </li>
                        <li class="noblue"><a href="#" onclick="bookmarkme();return false;"><i class="icon-bookmark icon-white"></i><label class="noblue">Bookmark this Dashboard</label></a></li>
                        <li data-bind="click: loadDashboardFromLocalFile"><i id="full-screen-icon" class="icon-folder-open icon-white"></i><label id="full-screen">Load Dashboard from File</label></li>
                        <li><i class="icon-download-alt icon-white"></i>
                            <label data-bind="click: saveDashboard" data-pretty="true">Save Dashboard to File</label>
                        </li>
                        <li id="add-pane" data-bind="click: createPane"><i class="icon-plus icon-white"></i><label>Add Pane</label></li>
                    </ul>
                </div>
            </div>
            <div id="datasources">
                <h2 class="title">DATASOURCES</h2>

                <div class="datasource-list-container">
                    <table class="table table-condensed sub-table" id="datasources-list" data-bind="if: datasources().length">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Last Updated</th>
                            <th>&nbsp;</th>
                        </tr>
                        </thead>
                        <tbody data-bind="foreach: datasources">
                        <tr>
                            <td>
                                <span class="text-button datasource-name" data-bind="text: name, pluginEditor: {operation: 'edit', type: 'datasource'}"></span>
                            </td>
                            <td data-bind="text: last_updated"></td>
                            <td>
                                <ul class="board-toolbar">
                                    <li data-bind="click: updateNow"><i class="icon-refresh icon-white"></i></li>
                                    <li data-bind="pluginEditor: {operation: 'delete', type: 'datasource'}">
                                        <i class="icon-trash icon-white"></i></li>
                                </ul>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <span class="text-button table-operation" data-bind="pluginEditor: {operation: 'add', type: 'datasource'}">ADD</span>
            </div>
        </div>
    </div>
	<div id="column-tools" class="responsive-column-width">
		<ul class="board-toolbar left-columns">
			<li class="column-tool add" data-bind="click: addGridColumnLeft"><span class="column-icon right"></span><i class="icon-arrow-left icon-white"></i></li>
			<li class="column-tool sub" data-bind="click: subGridColumnLeft"><span class="column-icon left"></span><i class="icon-arrow-right icon-white"></i></li>
		</ul>
		<ul class="board-toolbar right-columns">
			<li class="column-tool sub" data-bind="click: subGridColumnRight"><span class="column-icon right"></span><i class="icon-arrow-left icon-white"></i></li>
			<li class="column-tool add" data-bind="click: addGridColumnRight"><span class="column-icon left"></span><i class="icon-arrow-right icon-white"></i></li>
		</ul>
	</div>
    <div id="toggle-header" data-bind="click: toggleEditing">
        <i id="toggle-header-icon" class="icon-wrench icon-white"></i></div>
</header>

<div style="display:hidden">
    <ul data-bind="template: { name: 'pane-template', foreach: panes}">
    </ul>
</div>

<script type="text/html" id="pane-template">
    <li data-bind="pane: true">
        <header>
            <h1 data-bind="text: title"></h1>
            <ul class="board-toolbar pane-tools">
                <li data-bind="pluginEditor: {operation: 'add', type: 'widget'}">
                    <i class="icon-plus icon-white"></i>
                </li>
                <li data-bind="pluginEditor: {operation: 'edit', type: 'pane'}">
                    <i class="icon-wrench icon-white"></i>
                </li>
                <li data-bind="pluginEditor: {operation: 'delete', type: 'pane'}">
                    <i class="icon-trash icon-white"></i>
                </li>
            </ul>
        </header>
        <section data-bind="foreach: widgets">
            <div class="sub-section" data-bind="css: 'sub-section-height-' + height()">
                <div class="widget" data-bind="widget: true, css:{fillsize:fillSize}"></div>
                <div class="sub-section-tools">
                    <ul class="board-toolbar">
                        <!-- ko if:$parent.widgetCanMoveUp($data) -->
                        <li data-bind="click:$parent.moveWidgetUp"><i class="icon-chevron-up icon-white"></i></li>
                        <!-- /ko -->
                        <!-- ko if:$parent.widgetCanMoveDown($data) -->
                        <li data-bind="click:$parent.moveWidgetDown"><i class="icon-chevron-down icon-white"></i></li>
                        <!-- /ko -->
                        <li data-bind="pluginEditor: {operation: 'edit', type: 'widget'}"><i class="icon-wrench icon-white"></i></li>
                        <li data-bind="pluginEditor: {operation: 'delete', type: 'widget'}"><i class="icon-trash icon-white"></i></li>
                    </ul>
                </div>
            </div>
        </section>
    </li>
</script>

</body>
</html>
