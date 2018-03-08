<!DOCTYPE html>
<html ng-app="myApp" lang="en">
    <head>
        <title data-template="config:app-title">TokenEditor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

        <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.0/angular.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.0/angular-sanitize.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.0/angular-touch.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.0/angular-animate.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/angular-ui-grid/3.1.1/ui-grid.min.js"></script> 
		<link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/themes/smoothness/jquery-ui.css"/>	
		<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js"></script>		
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/angular-ui-grid/3.1.1/ui-grid.min.css"/>
	    <script src="https://cdn.jsdelivr.net/lodash/4.17.4/lodash.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/angular-ui-select/0.20.0/select.min.js"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/angular-ui-select/0.20.0/select.min.css"></script>
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css"/>
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap-theme.min.css"/>
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>
        <script type="text/javascript" src="js/ext/bootstrap-filestyle.js"></script>
		
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css">

        <script type="text/javascript" src="js/ext/Chart.js"></script>
        <script type="text/javascript" src="js/angular-chartjs/angular-chart.js"></script>
        <script type="text/javascript" src="js/ui-bootstrap-tpls-0.14.3.min.js"></script>
        <link rel="stylesheet" href="js/angular-chartjs/angular-chart.css"/>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap3-dialog/1.34.7/css/bootstrap-dialog.min.css"/>
        <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap3-dialog/1.34.7/js/bootstrap-dialog.min.js"></script>
        <script src="js/ext/underscore.js"></script>
        <link rel="stylesheet" href="css/ext/slider.css"/>
		<script src="js/ext/ui-slider/slider.js"></script>
        <link rel="stylesheet" type="text/css" href="css/style.css"/>
        <script type="text/javascript" src="js/TokenEditorImporter.js"></script>
        <script type="text/javascript" src="js/widgets/widgetFactory.js"></script>
        <script type="text/javascript" src="js/widgets/ClosedList.js"></script>
        <script type="text/javascript" src="js/widgets/ComboBox.js"></script>
        <script type="text/javascript" src="js/widgets/FreeText.js"></script>
        <script type="text/javascript" src="js/widgets/InflectionTable.js"></script>
        <script type="text/javascript" src="js/widgets/Link.js"></script>
		<script type="text/javascript" src="js/widgets/Boolean.js"></script>
        <script src="js/app.js"></script>
        <script src="js/directives.js"></script>

        <script>
var documents = {};

function createDocumentOption(doc){
    var opt = $(document.createElement('option'));
    opt.text(doc.name);
    opt.attr('value', doc.documentId);
    return opt;
}

$(document).ready(function () {
    $("option").click(function () {
        $('#docids').text($(this).attr('value'));
	
    });

    new TokenEditorImporter(
        $('#import').get(0),
        'document',
        function (data) {
            var scope = angular.element($("#MainCtrl")).scope();
            documents[data.documentId] = data;
            $('#docid')
                .append(createDocumentOption(data))
                .val(data.documentId)
                .change();
            BootstrapDialog.show({
                message: 'Your import was successful!'
            });
        },
        function(jqXHR, status, error){
            BootstrapDialog.show({
                message: 'Import failed: ' + error
            });
        }
    );

    $.getJSON('document', function (data) {
        documents = {};
        var opts = $('#docid');
        $.each(data, function (key, value) {
            documents[value.documentId] = value;
            opts.append(createDocumentOption(value));
        });
    });

    $('#docid').change(function(){
        angular.element($("#MainCtrl")).scope().httprequest($(this).attr('value'));
    });
});
        </script>
        <!-- Piwik -->
        <script type="text/javascript">
            var _paq = _paq || [];
            _paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            (function () {
                var u = "//clarin.oeaw.ac.at/piwik/";
                _paq.push(['setTrackerUrl', u + 'piwik.php']);
                _paq.push(['setSiteId', 10]);
                var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
                g.type = 'text/javascript'; g.async = true; g.defer = true; g.src = u + 'piwik.js'; s.parentNode.insertBefore(g, s);
            })();
        </script>
    <noscript><p><img src="//clarin.oeaw.ac.at/piwik/piwik.php?idsite=10" style="border:0;" alt="" /></p></noscript>
    <!-- End Piwik Code -->
</head>
<body>
    <div class="container" style="width:95%;" id="MainCtrl" ng-controller="MainCtrl" >
        <div class="row">
		<h3>Controls</h3>
            <div class="col-md-3">
                
                <div class="panel panel-default">
                    <div class="panel-heading" id="yf" ng-click="collapsefiles = !collapsefiles">
                        <h4 class="panel-title">Your Files</h4>
                    </div>
                    <select collapse="collapsefiles" id='docid' class="form-control" size="10">
                    </select>
                </div>
				</div>
				<div class="col-md-3">
                <div class="panel panel-default">
                    <div class="panel-heading" id="imp"   ng-click="collapseimport = !collapseimport">
                        <h4 class="panel-title">Import</h4>
                    </div>
                    <div collapse="collapseimport" id="import">
                    </div>
                </div></div>
				<div class="col-md-3">
                <div class="panel panel-default">
                    <div class="panel-heading" id="exp"   ng-click="collapseexport = !collapseexport">
                        <h4 class="panel-title">Export</h4>
                    </div>
                    <div collapse="collapseexport" id="export">
					
					<a target="_blank" href="document/{{currentDocId}}" download="{{currentDocId}}enriched.xml">enriched</a><br/>
					<a target="_blank"  href="document/{{currentDocId}}?inPlace=1" download="{{currentDocId}}.xml">updated in Place</a>
                    </div>
                </div></div>
				 <!--<div class="col-md-3"><div class="panel panel-default">
                    <div class="panel-heading" id="imp"   ng-click="collapsecontext = !collapsecontext">
                        <h4 class="panel-title">Context</h4>
                    </div>
					{{context.left}}
					<span style="background:#6F9;">{{focusedToken}}</span>
					{{context.right}}
                    <div collapse="collapsecontext" id="context">
                    </div>
                </div></div>-->
				<div>
                <div id="popup" class="modal-dialog"></div>
				</div>
				<!--<div class="panel panel-default">
                    <div class="panel-heading"  ng-click="collapsesettings = !collapsesettings">
                        <h4 class="panel-title">Settings</h4>
                    </div>

                    <span class="text-muted">
                        <div collapse="collapsesettings" >
                            <div id="settings" class="panel-body">
							<p>Select column for defining row colors based on content</p>
					
							<select ng-options="name for (name, value) in states" ng-model="selected" ng-change="showPropertyValues(selected)"></select>
							<table><tr style="line-height:25px;" ng-repeat="propertyvalue in propertyValues"><td>{{propertyvalue}}</td> <td class="colorpicker"><div  style="height:20px;width:20px;background-color: #f44336;float:left;"></div><div  style="height:20px;width:20px;background-color:#e91e63;float:left;"></div><div  style="height:20px;width:20px;background-color: #3f51b5;float:left;"></div><div  style="height:20px;width:20px;background-color: #00e676;float:left;"></div><div  style="height:20px;width:20px;background-color: #e0e0e0;float:left;"></div></td></tr></table>
							
                            </div>
                        </div>
                    </span>
                </div>-->
               <!--<div class="panel panel-default">
                    <div class="panel-heading"  ng-click="collapsestats = !collapsestats">
                        <h4 class="panel-title"> PoS Stats</h4>
                    </div>

                    <span class="text-muted">
                        <div collapse="collapsestats"  ng-controller="DoughnutCtrl">
                            <div class="panel-body">
                                <canvas id="doughnut"  class="chart chart-doughnut" data="data" labels="labels"></canvas> 
                            </div>
                        </div>
                    </span>
                </div>-->
                <!--<div class="panel panel-default">
                    <div class="panel-heading"  ng-click="collapsecontext = !collapsecontext">
                        <h4 class="panel-title">Context</h4>
                    </div>

                    <span class="text-muted">
                        <div collapse="collapsecontext" >
                            <div class="panel-body">
								<div   ui-slider  min="5" max="50" ng-model="sliderVals"></div>
								{{sliderVals}}
								<p style="font-weight:bold;">{{focusedTokenContext}}</p>
                            </div>
                        </div>
                    </span>
                </div>-->
				
            </div>
			<div class="row">
            <div class="col-md-10">
                <h3>tokenEditor</h3>
                <div id="grid1" style="min-height:500px;height:84vh;"  ui-grid="gridOptions"   ui-grid-resize-columns ui-grid-edit ui-grid-selection ui-grid-cellnav ui-grid-pagination ui-grid-exporter class="gridstyle"></div>
            </div>
			 <div class="col-md-2" style="margin-top:54px;"><div class="panel panel-default">
                    <div class="panel-heading" id="imp"   ng-click="collapsecontext = !collapsecontext">
                        <h4 class="panel-title">Context</h4>
                    </div>
					{{context.left}}
					<span style="background:#6F9;">{{focusedToken.token}}</span>
					{{context.right}}
                    <div collapse="collapsecontext" id="context">
                    </div>
                </div></div>
                <div class="col-md-2">
                <div ng-if="documentPrefs.progressproperty && tokenCount > 0" class="panel panel-default">
                    <div class="panel-heading"  ng-click="collapsestats = !collapsestats">
                        <h4 class="panel-title">Progress</h4>
                    </div>

                    <div  collapse="collapsestats" class="panel-body">
                   
                      <table style="width:100%" ng-controller="Stats">
                            <tr ng-repeat="stat in stats">
                            <td stlye="max-width: 1px;white-space: nowrap;">{{stat.value}}</td>
                            <td>{{stat.percentage}}%</td>
                            </tr>
                        </table>
                    </div>
                </div>
                </div>
 <div class="col-md-2" style="margin-top:54px;"><div class="panel panel-default">
                    <div class="panel-heading" id="imp"   ng-click="collapsebatch = !collapsebatch">
                        <h4 class="panel-title">Batch Edit</h4>
                    </div>
					<div class="form-group" ng-repeat="property in batchEditProperties">
					<label for="propertybatcheditfield">{{property.name}}</label>
					<input  class="form-control" type="text" id="propertybatcheditfield"  ng-model="batchEditToken[property.name]"/>
					</div>
					<button ng-click="assignToAll(batchEditToken)" type="submit" class="btn btn-primary">Assign to all</button>
                    <div collapse="collapsebatch" id="batch">
                    </div>
                </div></div>
        </div>
        <div class="panel panel-default" style="position:absolute;z-index:1;top:0;right:0;">
            <div class="panel-heading"  ng-init="collapseinfo = !collapseinfo" ng-click="collapseinfo = !collapseinfo">
                <h4 class="panel-title">Info</h4>
            </div>
            <div class="panel-body"  collapse="collapseinfo">
                <h3>How to use</h3>
                <h4>Import</h4>
                <p>Import your XML-File (<a href="sample_data/HausamSee.xml">demofile</a>) and your schema (<a href="sample_data/tokeneditor-schema.xml">demofile</a>) for the tokeneditor.
                    For producing the needed XML from plain text please go to the <a href="https://ttweb.eos.arz.oeaw.ac.at/">TreeTagger Web Interface</a>.
                <h4>Loading data</h4>
                <p>After the successful import you can see your file in the "Your Files" panel.<br/>
                    Click on the file to load it into the Grid.</p>
                <h4>Editing</h4> 
                <p>Click into a field in the grid to change the data. All changes are stored in the database immediately.<br/> 
                    Important: Fields in the column Id and Token cannot be changed.<br/>
                   <!-- Writing the letters "s" for sure or "u" for unsure will change the cell background. This column can be used to determine your progress.-->
                </p>
                <h4>Your user ID</h4>
                <p><?php echo(@$_SERVER[@$CONFIG['userid']]); ?> </p>
            </div>
        </div>
    </div>
    <div id="docids" style="display:none;"></div>
    <div id="tokencount" style="display:none;"></div>
</body>
</html>
