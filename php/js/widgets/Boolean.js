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

Boolean = function (prop, readOnly) {
    var that = this;

    this.prop = prop;
    this.readOnly = readOnly | false;

    this.draw = function (value, readOnly) {
        if(typeof(value) === 'string'){
            value = value === 'true';
        }
        
        if (readOnly || that.readOnly) {
			var text = $(document.createElement('i'));
			text.addClass('btn btn-default btn-xs');

            if(value === true){
                text.addClass('fa fa-check');
            }else{
                text.html('&nbsp;&nbsp;&nbsp;');
            }
            return text;
        }
		var nchb = $(document.createElement("input"));
        nchb.attr('type', 'checkbox');
		nchb.addClass('form-control');
        nchb.attr('data-value', that.prop.name);
   		nchb.prop('checked', value);
        return nchb;
    };

    this.search = function () {
        var nchb = document.createElement('select');
        nchb.add(new Option(''));
        nchb.add(new Option('true'));
        nchb.add(new Option('false'));
        nchb = $(nchb);
		nchb.attr('type','checkbox');
        nchb.attr('data-value', that.prop.name);
        nchb.addClass('form-control');
        return nchb;
    };
    
    this.registerInGrid = function(scope){
        return {
            field:                that.prop.name,
            cellTemplate:         that.getCellTemplate(scope, true),
            filterHeaderTemplate: that.getFilterHeaderTemplate(),
            editableCellTemplate: that.getEditableCellTemplate('ui-grid-editor'),
            enableCellEdit:       !that.readOnly,
        };
    };    
};
Boolean.prototype = WidgetBaseClass;
