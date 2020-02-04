/* 
 * Copyright (C) 2016 zozlak
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

VLEWidget = function (prop, readOnly) {
    var that = this;
    this.prop = prop;
    this.readOnly = readOnly | false;


    this.draw = function (value, readOnly) {
        if (readOnly || that.readOnly) {
            return $(document.createTextNode(value));
        }
    };


    this.search = function () {
        var sel = $(document.createElement('select'));
        sel.attr('data-value', that.prop.name);
        sel.addClass('form-control');
        return sel;
    };


    this.registerInGrid = function (scope) {


        scope.gridOptions.data.forEach(function (obj) {
            var valArray = [];
            obj[that.prop.name].split(" ").forEach(function (val) {
                if (val !== '') {
                    valArray.push({ id: val });
                }
            });
            obj[that.prop.name] = valArray;
        });

        scope.VLEData = [];
        scope.VLEPopUpStats = [];
        scope.VLEDataLoading = false;

        scope.queryVLEData = function (query) {
            if (query.length >= 3) {

                fetch(that.prop.baseUrl)
                    .then((response) => {
                        return response.json();
                    })
                    .then((data) => {
                        scope.VLEData = (data["_embedded"]["entries"]);
                        scope.VLEPopUpStats.length = scope.VLEData.length;
                        scope.VLEPopUpStats.fill(false);
                        scope.VLEDataLoading = false;
                    })
            }
        }

        scope.resetVLEPopUpStats = function () {
            scope.VLEPopUpStats.length = 0;
            scope.VLEPopUpStats.fill(false);
        }

        scope.log = function (msg) {
            console.log(msg);
        }

        scope.HTMLToolTip = function (data) {
            return data ? '<div><pre class="VLETooltip">' + hljs.highlight('xml', data).value + '</pre></div>' : '<pre/>';
        }

        return {
            field: that.prop.name,
            //cellTemplate: that.getCellTemplate(scope),
            cellTemplate:
                '<div>' +
                '<div class="ui-grid-cell-contents">{{ COL_FIELD }}</div>' +
                '</div>',
            filterHeaderTemplate: that.getFilterHeaderTemplate(),
            editableCellTemplate:
                '<customautocomplete>' +
                '<ui-select append-to-body="true" customuiselect class="form-control-sm" multiple ng-model="MODEL_COL_FIELD" ng-model-options="{getterSetter:true,debounce:200}" theme="bootstrap" style="width:auto !important;" >' +
                '<ui-select-match>{{ $item.id}}</ui-select-match>' +
                '<ui-select-choices  position="down" style="display:inline"; refresh="grid.appScope.queryVLEData($select.search)" repeat="entry.id as entry in grid.appScope.VLEData">' +
                '<span  ng-mouseenter="grid.appScope.resetVLEPopUpStats();grid.appScope.VLEPopUpStats[$index] = true"><span  popover-append-to-body="true" popover-trigger="\'none\'"  popover-is-open="grid.appScope.VLEPopUpStats[$index]"  popover-placement="right" uib-popover-html="grid.appScope.HTMLToolTip(entry.entry)">{{ entry.lemma }}</span></span>' +
                '</ui-select-choices>' +
                '</ui-select>'+
                '</customautocomplete>',
            //that.getEditableCellTemplate('ui-grid-edit-dropdown'),
            enableCellEdit: !that.readOnly
        };
    };
};
VLEWidget.prototype = WidgetBaseClass;

