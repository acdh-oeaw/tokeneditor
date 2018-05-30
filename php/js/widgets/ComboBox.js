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

ComboBox = function (prop, readOnly) {
    var that = this;

    this.prop = prop;
    this.readOnly = readOnly | false;

    this.draw = function (value, readOnly) {
        if (readOnly || that.readOnly) {
            return $(document.createTextNode(value));
        }

        
        var input = $(document.createElement('input'));
       input.attr('type','text');
      input.attr('uib-typeahead','item for item in col.colDef.editDropdownOptionsArray |  filter:$viewValue');
      input.attr('typeahead-min-length','0');
      input.attr('ui-grid-editor-typeahead');
      input.attr('typeahead-on-select','onTypeaheadSelect(row.entity, col.colDef.editModelField, $item)');
      input.attr('typeahead-is-open','isTypeaheadOpen');
      input.attr('ng-model','selected');
      
        return input;
    };
  
    this.search = function () {
        var sel = $(document.createElement('select'));
        sel.attr('data-value', that.prop.name);
        sel.addClass('form-control');
        that.fillWithOptions(sel.get(0), true);
        return sel;
    };

   

    this.fillWithOptions = function (comboboxDataList, addEmpty) {
        if (addEmpty && that.prop.values.indexOf('') < 0) {
            comboboxDataList.add(new Option(''));
        }
        $.each(that.prop.values, function (key, value) {
            comboboxDataList.append(new Option(value));
        });
    };
    
  

    this.registerInGrid = function(scope){

        return {
            field:                that.prop.name,
            cellTemplate:         that.getCellTemplate(scope),
            filterHeaderTemplate: that.getFilterHeaderTemplate(),
            editableCellTemplate: that.getEditableCellTemplate('ui-grid-editor'), 
            //editableCellTemplate: '<input type="text" ng-model="MODEL_COL_FIELD" uib-typeahead="item for item in col.colDef.editDropdownOptionsArray | filter:$viewValue" ng-required="true" ui-grid-editor-typeahead typeahead-is-open="isTypeaheadOpen" typeahead-on-select="onTypeaheadSelect(row.entity, col.colDef.editModelField, $item)" />',
          
           editDropdownOptionsArray:that.prop.values,
            enableCellEdit:       !that.readOnly
        };
    };    
};
ComboBox.prototype = WidgetBaseClass;
